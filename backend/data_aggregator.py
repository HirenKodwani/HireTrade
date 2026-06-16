from database import IPORecord, SessionLocal, SourceHealth, utc_now
from source_adapters import (
    BSEIssueAdapter,
    ChittorgarhSubscriptionAdapter,
    ComprehensiveScraperAdapter,
    InvestorGainAdapter,
    IPOWatchGMPAdapter,
    NSEIssueAdapter,
    PublicIPONewsAdapter,
)
from validation_engine import evaluate_record, rank_accepted_ipos


METRIC_FIELDS = (
    "current_price",
    "gmp",
    "qib_subscription",
    "retail_subscription",
    "pe_ratio",
    "revenue_growth_yoy",
    "profit_growth_yoy",
    "sentiment_score",
    "open_date",
    "close_date",
    "is_sme",
)


def discovery_adapters():
    """
    Returns all live data adapters in priority order:
    1. Chittorgarh — subscription rates (most reliable Indian source)
    2. InvestorGain — GMP + subscription
    3. IPOWatch GMP  — GMP + price
    4. Comprehensive — orchestrates all + yfinance + fallbacks
    """
    return [
        ChittorgarhSubscriptionAdapter(),
        InvestorGainAdapter(),
        IPOWatchGMPAdapter(),
        ComprehensiveScraperAdapter(),
    ]


def _set_source_health(db, name, status, message="", records_seen=0):
    now = utc_now()
    health = db.query(SourceHealth).filter(SourceHealth.source_name == name).first()
    if not health:
        health = SourceHealth(source_name=name)
        db.add(health)
    health.status = status
    health.message = message
    health.records_seen = records_seen
    health.last_attempt_at = now
    if status == "OK":
        health.last_success_at = now
    return health


def collect_raw_inputs(db, adapters=None):
    merged = {}
    health = []
    for adapter in adapters or discovery_adapters():
        try:
            records = adapter.fetch()
            status = "OK" if records else "DEGRADED"
            message = "" if records else "No IPO rows parsed from public source"
            health.append(_set_source_health(db, adapter.name, status, message, len(records)))
        except Exception as exc:
            records = []
            health.append(_set_source_health(db, adapter.name, "FAILED", str(exc), 0))

        for record in records:
            key = record.get("key") or record["symbol"]
            item = merged.setdefault(
                key,
                {
                    "symbol": record["symbol"],
                    "company_name": record["company_name"],
                    "metric_sources": {},
                    "source_payload": {},
                },
            )
            item["company_name"] = record.get("company_name") or item["company_name"]
            item["symbol"] = record.get("symbol") or item["symbol"]
            for field in METRIC_FIELDS:
                if record.get(field) is not None:
                    item[field] = record[field]
                    item["metric_sources"][field] = adapter.name
            item["source_payload"][adapter.name] = record.get("raw", {})

    return list(merged.values()), health


def _find_record(db, raw):
    record = db.query(IPORecord).filter(IPORecord.symbol == raw["symbol"]).first()
    if record:
        return record
    return db.query(IPORecord).filter(IPORecord.company_name == raw["company_name"]).first()


def _upsert_record(db, raw):
    record = _find_record(db, raw)
    if not record:
        record = IPORecord(
            symbol=raw["symbol"],
            company_name=raw["company_name"],
            discovered_at=utc_now(),
        )
        db.add(record)
        db.flush()

    record.company_name = raw["company_name"]
    metric_sources = dict(record.metric_sources or {})
    for field in METRIC_FIELDS:
        if raw.get(field) is None or metric_sources.get(field) == "review":
            continue
        setattr(record, field, raw[field])
        metric_sources[field] = raw["metric_sources"].get(field, "public-source")

    source_payload = dict(record.source_payload or {})
    source_payload.update(raw.get("source_payload", {}))
    record.metric_sources = metric_sources
    record.source_payload = source_payload
    record.updated_at = utc_now()
    evaluate_record(db, record)
    return record


def run_discovery(adapters=None):
    db = SessionLocal()
    try:
        raw_records, health = collect_raw_inputs(db, adapters)
        updated = [_upsert_record(db, raw) for raw in raw_records]
        rank_accepted_ipos(db)
        db.commit()
        return {
            "records_seen": len(raw_records),
            "records_updated": len(updated),
            "sources": [
                {
                    "source_name": item.source_name,
                    "status": item.status,
                    "message": item.message,
                    "records_seen": item.records_seen,
                }
                for item in health
            ],
            "ipo_ids": [record.id for record in updated],
        }
    finally:
        db.close()


def simulate_ipo_discovery():
    """Compatibility wrapper for the original trigger route."""
    summary = run_discovery()
    if not summary["ipo_ids"]:
        return None

    db = SessionLocal()
    try:
        return db.query(IPORecord).filter(IPORecord.id == summary["ipo_ids"][0]).first()
    finally:
        db.close()


def fetch_news_feed():
    adapter = PublicIPONewsAdapter()
    db = SessionLocal()
    try:
        try:
            items = adapter.fetch()
            status = "OK" if items else "DEGRADED"
            message = "" if items else "No public IPO news items parsed"
            _set_source_health(db, adapter.name, status, message, len(items))
        except Exception as exc:
            items = []
            _set_source_health(db, adapter.name, "FAILED", str(exc), 0)
        db.commit()
        return items
    finally:
        db.close()
