from database import DecisionConfig, IPORecord, SessionLocal, utc_now


REQUIRED_METRICS = (
    "current_price",
)

METRIC_LABELS = {
    "current_price": "Issue price",
    "gmp": "Grey market premium",
    "qib_subscription": "QIB subscription",
    "retail_subscription": "Retail subscription",
    "pe_ratio": "P/E ratio",
    "revenue_growth_yoy": "Revenue growth YoY",
    "profit_growth_yoy": "Profit growth YoY",
    "sentiment_score": "Sentiment score",
}

ACTIVE_LIFECYCLE_STATUSES = {None, "", "DISCOVERED"}


def missing_metric_fields(ipo):
    missing = []
    for field in REQUIRED_METRICS:
        value = getattr(ipo, field)
        if value is None:
            missing.append(field)
        elif field == "current_price" and value <= 0:
            missing.append(field)
    return missing


def refresh_completeness(ipo):
    missing = missing_metric_fields(ipo)
    ipo.missing_metrics = missing
    ipo.review_required = bool(missing)
    ipo.data_status = "NEEDS_REVIEW" if missing else "COMPLETE"
    return missing


def _decision_age_hours(ipo):
    anchor = ipo.discovered_at or ipo.open_date or ipo.updated_at or utc_now()
    return max(0.0, (utc_now() - anchor).total_seconds() / 3600)


def _score_from_checks(checks):
    passed = len([check for check in checks if check["passed"]])
    return round((passed / len(checks)) * 100, 1) if checks else 0.0


def _set_needs_review(ipo, reasons, missing=None):
    ipo.decision = "NEEDS_REVIEW"
    ipo.decision_reasons = reasons
    ipo.decision_score = 0.0
    ipo.confidence = 0.0
    ipo.recommended_lots = 0
    if missing:
        labels = ", ".join(METRIC_LABELS[field] for field in missing)
        ipo.next_action = f"Review missing metrics: {labels}"
    else:
        ipo.next_action = "Wait or review normalized metrics"


def evaluate_record(db, ipo):
    """Evaluate one normalized IPO record against stored decision thresholds."""
    config = db.query(DecisionConfig).first()
    if not config:
        config = DecisionConfig()
        db.add(config)
        db.flush()

    missing = refresh_completeness(ipo)
    if missing:
        labels = [METRIC_LABELS[field] for field in missing]
        _set_needs_review(ipo, [f"Missing normalized metric: {label}" for label in labels], missing)
        return {
            "decision": ipo.decision,
            "reasons": ipo.decision_reasons,
            "confidence": ipo.confidence,
            "score": ipo.decision_score,
        }

    age_hours = _decision_age_hours(ipo)
    if age_hours < config.min_decision_age_hours:
        reason = (
            f"Waiting for minimum decision age "
            f"({age_hours:.1f}/{config.min_decision_age_hours:.1f} hours)"
        )
        _set_needs_review(ipo, [reason])
        ipo.data_status = "COMPLETE"
        ipo.review_required = False
        return {
            "decision": ipo.decision,
            "reasons": ipo.decision_reasons,
            "confidence": ipo.confidence,
            "score": ipo.decision_score,
        }

    gmp_percent = (ipo.gmp / ipo.current_price) * 100 if ipo.current_price and ipo.gmp is not None else 0.0
    checks = [
        {
            "passed": gmp_percent >= config.min_gmp_percent,
            "reason": "GMP below threshold",
        },
        {
            "passed": ipo.qib_subscription is not None and ipo.qib_subscription >= config.min_qib_sub,
            "reason": "QIB subscription below threshold (or missing)",
        },
        {
            "passed": ipo.retail_subscription is not None and ipo.retail_subscription >= config.min_retail_sub,
            "reason": "Retail subscription below threshold (or missing)",
        },
        {
            "passed": ipo.pe_ratio is None or ipo.pe_ratio <= config.max_pe_ratio,
            "reason": "P/E ratio exceeds threshold",
        },
        {
            "passed": ipo.revenue_growth_yoy is None or ipo.revenue_growth_yoy >= config.min_revenue_yoy,
            "reason": "Revenue growth below threshold",
        },
        {
            "passed": ipo.profit_growth_yoy is None or ipo.profit_growth_yoy >= config.min_profit_yoy,
            "reason": "Profit growth below threshold",
        },
        {
            "passed": ipo.sentiment_score is None or ipo.sentiment_score >= config.min_sentiment,
            "reason": "Sentiment score below threshold",
        },
    ]
    reasons = [check["reason"] for check in checks if not check["passed"]]
    score = _score_from_checks(checks)

    ipo.decision_score = score
    ipo.confidence = score
    ipo.decision_reasons = reasons or ["All configured validation checks passed"]
    if reasons:
        ipo.decision = "REJECTED"
        ipo.recommended_lots = 0
        ipo.next_action = "Monitor metrics or update validation thresholds"
    else:
        ipo.decision = "ACCEPTED"
        ipo.recommended_lots = max(1, config.max_lots_per_ipo)
        if ipo.lifecycle_status in ACTIVE_LIFECYCLE_STATUSES:
            ipo.lifecycle_status = "READY_TO_APPLY"
            ipo.next_action = "Simulate application handoff"

    return {
        "decision": ipo.decision,
        "reasons": ipo.decision_reasons,
        "confidence": ipo.confidence,
        "score": ipo.decision_score,
    }


def rank_accepted_ipos(db):
    db.flush()
    accepted = db.query(IPORecord).filter(IPORecord.decision == "ACCEPTED").all()
    ranked = sorted(
        accepted,
        key=lambda ipo: (
            ipo.decision_score or 0.0,
            ((ipo.gmp or 0.0) / ipo.current_price) if ipo.current_price else 0.0,
            ipo.qib_subscription or 0.0,
        ),
        reverse=True,
    )
    for index, ipo in enumerate(ranked, start=1):
        ipo.comparative_rank = index

    for ipo in db.query(IPORecord).filter(IPORecord.decision != "ACCEPTED").all():
        ipo.comparative_rank = None

    return ranked


def evaluate_ipo(ipo_id):
    db = SessionLocal()
    try:
        ipo = db.query(IPORecord).filter(IPORecord.id == ipo_id).first()
        if not ipo:
            return None
        result = evaluate_record(db, ipo)
        rank_accepted_ipos(db)
        db.commit()
        db.refresh(ipo)
        return result
    finally:
        db.close()
