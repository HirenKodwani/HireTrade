import os
from datetime import datetime, timezone

from sqlalchemy import (
    JSON,
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    create_engine,
    inspect,
)
from sqlalchemy.orm import declarative_base, sessionmaker


DATABASE_URL = os.getenv("IPO_DATABASE_URL", "sqlite:///./ipo_algo.db")


def _build_engine(database_url):
    connect_args = {"check_same_thread": False} if database_url.startswith("sqlite") else {}
    return create_engine(database_url, connect_args=connect_args)


engine = _build_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def utc_now():
    return datetime.now(timezone.utc).replace(tzinfo=None)


def configure_database(database_url):
    """Rebind the shared session factory for tests or alternate local databases."""
    global DATABASE_URL, engine

    engine.dispose()
    DATABASE_URL = database_url
    engine = _build_engine(database_url)
    SessionLocal.configure(bind=engine)
    return engine


class IPORecord(Base):
    __tablename__ = "ipo_records"

    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String, unique=True, index=True)
    company_name = Column(String)
    open_date = Column(DateTime, nullable=True)
    close_date = Column(DateTime, nullable=True)
    discovered_at = Column(DateTime, default=utc_now)
    is_sme = Column(Boolean, default=False)

    # Normalized IPO metrics. Null means the public-source pipeline has not sourced it yet.
    current_price = Column(Float, nullable=True)
    pe_ratio = Column(Float, nullable=True)
    revenue_growth_yoy = Column(Float, nullable=True)
    profit_growth_yoy = Column(Float, nullable=True)
    qib_subscription = Column(Float, nullable=True)
    retail_subscription = Column(Float, nullable=True)
    gmp = Column(Float, nullable=True)
    sentiment_score = Column(Float, nullable=True)

    data_status = Column(String, default="NEEDS_REVIEW")
    review_required = Column(Boolean, default=True)
    missing_metrics = Column(JSON, default=list)
    metric_sources = Column(JSON, default=dict)
    source_payload = Column(JSON, default=dict)

    decision = Column(String, default="NEEDS_REVIEW")
    decision_reasons = Column(JSON, default=list)
    decision_score = Column(Float, default=0.0)
    confidence = Column(Float, default=0.0)
    recommended_lots = Column(Integer, default=0)
    comparative_rank = Column(Integer, nullable=True)

    lifecycle_status = Column(String, default="DISCOVERED")
    next_action = Column(String, default="Review normalized metrics")
    listing_price = Column(Float, nullable=True)
    simulated_pnl = Column(Float, default=0.0)
    exit_rationale = Column(Text, nullable=True)
    updated_at = Column(DateTime, default=utc_now)


class DecisionConfig(Base):
    """User-defined validation and demo simulation configuration."""

    __tablename__ = "decision_config"

    id = Column(Integer, primary_key=True, index=True)
    min_decision_age_hours = Column(Float, default=0.0)
    min_gmp_percent = Column(Float, default=5.0)
    min_qib_sub = Column(Float, default=1.0)
    min_retail_sub = Column(Float, default=0.5)
    max_pe_ratio = Column(Float, default=100.0)
    min_revenue_yoy = Column(Float, default=2.0)
    min_profit_yoy = Column(Float, default=2.0)
    min_sentiment = Column(Float, default=20.0)
    max_fund_allocation_percent = Column(Float, default=10.0)
    max_lots_per_ipo = Column(Integer, default=1)


class SourceHealth(Base):
    __tablename__ = "source_health"

    id = Column(Integer, primary_key=True, index=True)
    source_name = Column(String, unique=True, index=True)
    status = Column(String, default="UNKNOWN")
    message = Column(Text, default="")
    records_seen = Column(Integer, default=0)
    last_attempt_at = Column(DateTime, default=utc_now)
    last_success_at = Column(DateTime, nullable=True)


class MetricReview(Base):
    __tablename__ = "metric_reviews"

    id = Column(Integer, primary_key=True, index=True)
    ipo_id = Column(Integer, ForeignKey("ipo_records.id"), index=True)
    metrics = Column(JSON, default=dict)
    note = Column(Text, default="")
    created_at = Column(DateTime, default=utc_now)


class LifecycleEvent(Base):
    __tablename__ = "lifecycle_events"

    id = Column(Integer, primary_key=True, index=True)
    ipo_id = Column(Integer, ForeignKey("ipo_records.id"), index=True)
    event_type = Column(String)
    status_after = Column(String)
    message = Column(Text, default="")
    payload = Column(JSON, default=dict)
    created_at = Column(DateTime, default=utc_now)


class NotificationEvent(Base):
    __tablename__ = "notification_events"

    id = Column(Integer, primary_key=True, index=True)
    ipo_id = Column(Integer, ForeignKey("ipo_records.id"), nullable=True, index=True)
    level = Column(String, default="INFO")
    title = Column(String)
    message = Column(Text, default="")
    created_at = Column(DateTime, default=utc_now)


class SimulationState(Base):
    __tablename__ = "simulation_state"

    id = Column(Integer, primary_key=True, index=True)
    enabled = Column(Boolean, default=False)
    interval_seconds = Column(Integer, default=20)
    last_tick_at = Column(DateTime, nullable=True)


IPO_MIGRATION_COLUMNS = {
    "discovered_at": "DATETIME",
    "data_status": "VARCHAR DEFAULT 'NEEDS_REVIEW'",
    "review_required": "BOOLEAN DEFAULT 1",
    "missing_metrics": "JSON",
    "metric_sources": "JSON",
    "source_payload": "JSON",
    "decision_reasons": "JSON",
    "decision_score": "FLOAT DEFAULT 0.0",
    "comparative_rank": "INTEGER",
    "lifecycle_status": "VARCHAR DEFAULT 'DISCOVERED'",
    "next_action": "VARCHAR DEFAULT 'Review normalized metrics'",
    "listing_price": "FLOAT",
    "simulated_pnl": "FLOAT DEFAULT 0.0",
    "exit_rationale": "TEXT",
}

CONFIG_MIGRATION_COLUMNS = {
    "min_decision_age_hours": "FLOAT DEFAULT 0.0",
    "max_fund_allocation_percent": "FLOAT DEFAULT 10.0",
}


def _add_missing_columns(table_name, column_specs):
    known_columns = {column["name"] for column in inspect(engine).get_columns(table_name)}
    with engine.begin() as connection:
        for column_name, sql_spec in column_specs.items():
            if column_name not in known_columns:
                connection.exec_driver_sql(
                    f"ALTER TABLE {table_name} ADD COLUMN {column_name} {sql_spec}"
                )


def _migrate_existing_schema():
    table_names = set(inspect(engine).get_table_names())
    if "ipo_records" in table_names:
        _add_missing_columns("ipo_records", IPO_MIGRATION_COLUMNS)
        with engine.begin() as connection:
            connection.exec_driver_sql(
                "UPDATE ipo_records SET data_status = 'NEEDS_REVIEW' "
                "WHERE data_status IS NULL"
            )
            connection.exec_driver_sql(
                "UPDATE ipo_records SET lifecycle_status = 'DISCOVERED' "
                "WHERE lifecycle_status IS NULL"
            )
            connection.exec_driver_sql(
                "UPDATE ipo_records SET next_action = 'Revalidate IPO metrics' "
                "WHERE next_action IS NULL"
            )
            connection.exec_driver_sql(
                "UPDATE ipo_records SET review_required = 0 "
                "WHERE review_required IS NULL"
            )
    if "decision_config" in table_names:
        _add_missing_columns("decision_config", CONFIG_MIGRATION_COLUMNS)


def seed_mock_ipos(db):
    # Mock data generation has been removed as per the strict NO FAKE DATA rule.
    # The database must only be populated via real scrapers.
    pass



def init_db():
    Base.metadata.create_all(bind=engine)
    _migrate_existing_schema()

    db = SessionLocal()
    try:
        if not db.query(DecisionConfig).first():
            db.add(DecisionConfig())
        if not db.query(SimulationState).first():
            db.add(SimulationState())
        db.commit()
        seed_mock_ipos(db)
    finally:
        db.close()
