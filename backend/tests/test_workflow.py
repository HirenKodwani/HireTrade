import sqlite3
import tempfile
import unittest
from pathlib import Path

from database import IPORecord, SessionLocal, configure_database, init_db
from data_aggregator import run_discovery
from lifecycle_engine import advance_lifecycle
from main import (
    ConfigUpdate,
    MetricReviewUpdate,
    get_analytics,
    review_metrics,
    update_config,
)
from validation_engine import evaluate_record, rank_accepted_ipos


class GoodPartialAdapter:
    name = "Good Partial Adapter"

    def fetch(self):
        return [
            {
                "key": "demo-partial",
                "symbol": "DEMO-PARTIAL",
                "company_name": "Demo Partial IPO",
                "current_price": 100.0,
                "gmp": 18.0,
                "metric_sources": {},
                "raw": {"source": "test"},
            }
        ]


class FailingAdapter:
    name = "Failing Adapter"

    def fetch(self):
        raise RuntimeError("public source unavailable")


def passing_record(symbol="PASSING"):
    return IPORecord(
        symbol=symbol,
        company_name=f"{symbol} IPO",
        current_price=100.0,
        gmp=20.0,
        qib_subscription=3.2,
        retail_subscription=1.8,
        pe_ratio=28.0,
        revenue_growth_yoy=18.0,
        profit_growth_yoy=14.0,
        sentiment_score=72.0,
    )


class WorkflowTests(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        database_path = Path(self.temp_dir.name) / "workflow.db"
        configure_database(f"sqlite:///{database_path.as_posix()}")
        init_db()
        self.db = SessionLocal()

    def tearDown(self):
        self.db.close()
        configure_database("sqlite:///:memory:")
        self.temp_dir.cleanup()

    def test_source_failure_isolated_and_missing_data_needs_review(self):
        summary = run_discovery([FailingAdapter(), GoodPartialAdapter()])
        record = self.db.query(IPORecord).filter(IPORecord.symbol == "DEMO-PARTIAL").first()

        self.assertEqual(summary["records_seen"], 1)
        self.assertEqual(record.decision, "NEEDS_REVIEW")
        self.assertIn("pe_ratio", record.missing_metrics)
        statuses = {source["source_name"]: source["status"] for source in summary["sources"]}
        self.assertEqual(statuses["Failing Adapter"], "FAILED")
        self.assertEqual(statuses["Good Partial Adapter"], "OK")

    def test_review_metrics_accepts_record_and_audits_sources(self):
        self.db.add(
            IPORecord(
                symbol="REVIEW",
                company_name="Review IPO",
                current_price=100.0,
                gmp=16.0,
            )
        )
        self.db.commit()
        record = self.db.query(IPORecord).filter(IPORecord.symbol == "REVIEW").first()
        evaluate_record(self.db, record)
        self.db.commit()

        payload = review_metrics(
            record.id,
            MetricReviewUpdate(
                qib_subscription=3.0,
                retail_subscription=1.5,
                pe_ratio=32.0,
                revenue_growth_yoy=12.0,
                profit_growth_yoy=11.0,
                sentiment_score=68.0,
                note="Reviewed from test offer document.",
            ),
            self.db,
        )

        self.assertEqual(payload["decision"], "ACCEPTED")
        self.assertEqual(payload["lifecycle_status"], "READY_TO_APPLY")
        self.assertEqual(payload["metric_sources"]["pe_ratio"], "review")
        self.assertEqual(len(payload["reviews"]), 1)

    def test_lifecycle_advances_to_closed_analytics(self):
        record = passing_record()
        self.db.add(record)
        self.db.flush()
        evaluate_record(self.db, record)
        rank_accepted_ipos(self.db)
        self.db.commit()

        for event_type in ("APPLY", "MANDATE", "ALLOT", "EXIT", "CLOSE"):
            advance_lifecycle(self.db, record, event_type)
        self.db.commit()

        analytics = get_analytics(self.db)
        self.assertEqual(record.lifecycle_status, "CLOSED")
        self.assertEqual(analytics["closed_trades"], 1)
        self.assertEqual(len(analytics["past_trades"]), 1)
        self.assertIsNotNone(record.listing_price)

    def test_config_update_revalidates_existing_record(self):
        record = passing_record("CONFIG")
        self.db.add(record)
        self.db.flush()
        evaluate_record(self.db, record)
        self.db.commit()

        result = update_config(ConfigUpdate(min_gmp_percent=90.0), self.db)
        self.db.refresh(record)

        self.assertEqual(result["status"], "success")
        self.assertEqual(record.decision, "REJECTED")
        self.assertIn("GMP below threshold", record.decision_reasons)


class MigrationTests(unittest.TestCase):
    def test_original_two_table_sqlite_shape_migrates_in_place(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            database_path = Path(temp_dir) / "old.db"
            connection = sqlite3.connect(database_path)
            connection.executescript(
                """
                CREATE TABLE ipo_records (
                    id INTEGER PRIMARY KEY,
                    symbol VARCHAR,
                    company_name VARCHAR,
                    open_date DATETIME,
                    close_date DATETIME,
                    is_sme BOOLEAN,
                    current_price FLOAT,
                    pe_ratio FLOAT,
                    revenue_growth_yoy FLOAT,
                    profit_growth_yoy FLOAT,
                    qib_subscription FLOAT,
                    retail_subscription FLOAT,
                    gmp FLOAT,
                    sentiment_score FLOAT,
                    decision VARCHAR,
                    confidence FLOAT,
                    recommended_lots INTEGER,
                    updated_at DATETIME
                );
                CREATE TABLE decision_config (
                    id INTEGER PRIMARY KEY,
                    min_gmp_percent FLOAT,
                    min_qib_sub FLOAT,
                    min_retail_sub FLOAT,
                    max_pe_ratio FLOAT,
                    min_revenue_yoy FLOAT,
                    min_profit_yoy FLOAT,
                    min_sentiment FLOAT,
                    max_lots_per_ipo INTEGER
                );
                INSERT INTO ipo_records (id, symbol, company_name) VALUES (1, 'OLD', 'Old IPO');
                INSERT INTO decision_config (id, min_gmp_percent) VALUES (1, 10.0);
                """
            )
            connection.commit()
            connection.close()

            configure_database(f"sqlite:///{database_path.as_posix()}")
            init_db()
            connection = sqlite3.connect(database_path)
            ipo_columns = {column[1] for column in connection.execute("PRAGMA table_info(ipo_records)")}
            config_columns = {
                column[1] for column in connection.execute("PRAGMA table_info(decision_config)")
            }
            record_count = connection.execute("SELECT COUNT(*) FROM ipo_records").fetchone()[0]
            connection.close()

            configure_database("sqlite:///:memory:")
            self.assertIn("lifecycle_status", ipo_columns)
            self.assertIn("missing_metrics", ipo_columns)
            self.assertIn("max_fund_allocation_percent", config_columns)
            self.assertEqual(record_count, 1)


if __name__ == "__main__":
    unittest.main()
