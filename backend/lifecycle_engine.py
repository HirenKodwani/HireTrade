from database import IPORecord, LifecycleEvent, NotificationEvent, utc_now


NEXT_EVENT_BY_STATUS = {
    "READY_TO_APPLY": "APPLY",
    "APPLICATION_SIMULATED": "MANDATE",
    "MANDATE_SIMULATED": "ALLOT",
    "ALLOTMENT_SIMULATED": "EXIT",
    "EXIT_RECOMMENDED": "CLOSE",
}

NEXT_ACTION_BY_STATUS = {
    "DISCOVERED": "Complete review and validation",
    "READY_TO_APPLY": "Simulate application handoff",
    "APPLICATION_SIMULATED": "Simulate UPI mandate response",
    "MANDATE_SIMULATED": "Simulate allotment result",
    "ALLOTMENT_SIMULATED": "Generate sell decision",
    "EXIT_RECOMMENDED": "Close simulated trade",
    "CLOSED": "Review report analytics",
}


def _event_payload(ipo):
    return {
        "decision_score": ipo.decision_score,
        "recommended_lots": ipo.recommended_lots,
        "listing_price": ipo.listing_price,
        "simulated_pnl": ipo.simulated_pnl,
    }


def _record_event(db, ipo, event_type, message):
    event = LifecycleEvent(
        ipo_id=ipo.id,
        event_type=event_type,
        status_after=ipo.lifecycle_status,
        message=message,
        payload=_event_payload(ipo),
    )
    db.add(event)
    db.add(
        NotificationEvent(
            ipo_id=ipo.id,
            level="INFO",
            title=f"{ipo.company_name}: {ipo.lifecycle_status.replace('_', ' ').title()}",
            message=message,
        )
    )
    return event


def _sell_decision(ipo):
    issue_price = ipo.current_price or 0.0
    gmp_percent = ((ipo.gmp or 0.0) / issue_price) * 100 if issue_price else 0.0
    gain_percent = max(-8.0, min(38.0, (gmp_percent * 0.55) + ((ipo.decision_score or 0) * 0.08) - 3))
    ipo.listing_price = round(issue_price * (1 + (gain_percent / 100)), 2)
    lots = ipo.recommended_lots or 1
    ipo.simulated_pnl = round((ipo.listing_price - issue_price) * lots, 2)
    if gain_percent >= 15:
        ipo.exit_rationale = (
            f"SELL recommendation: simulated listing gain is {gain_percent:.1f}%."
        )
    elif gain_percent >= 0:
        ipo.exit_rationale = (
            f"TRIM recommendation: simulated listing gain is {gain_percent:.1f}%."
        )
    else:
        ipo.exit_rationale = (
            f"RISK EXIT recommendation: simulated listing move is {gain_percent:.1f}%."
        )


def advance_lifecycle(db, ipo, requested_event="ADVANCE"):
    if ipo.decision != "ACCEPTED":
        raise ValueError("Only accepted IPOs can enter simulated application lifecycle.")
    if ipo.lifecycle_status == "CLOSED":
        raise ValueError("This simulated lifecycle is already closed.")

    event_type = requested_event.upper()
    if event_type == "ADVANCE":
        event_type = NEXT_EVENT_BY_STATUS.get(ipo.lifecycle_status)
    expected_event = NEXT_EVENT_BY_STATUS.get(ipo.lifecycle_status)
    if event_type != expected_event:
        raise ValueError(
            f"{event_type or 'UNKNOWN'} is not valid from {ipo.lifecycle_status}."
        )

    if event_type == "APPLY":
        ipo.lifecycle_status = "APPLICATION_SIMULATED"
        message = "Manual Demat application handoff was simulated."
    elif event_type == "MANDATE":
        ipo.lifecycle_status = "MANDATE_SIMULATED"
        message = "UPI mandate acknowledgement was simulated."
    elif event_type == "ALLOT":
        ipo.lifecycle_status = "ALLOTMENT_SIMULATED"
        message = "IPO allotment outcome was simulated for the accepted recommendation."
    elif event_type == "EXIT":
        _sell_decision(ipo)
        ipo.lifecycle_status = "EXIT_RECOMMENDED"
        message = ipo.exit_rationale
    elif event_type == "CLOSE":
        ipo.lifecycle_status = "CLOSED"
        message = "Simulated exit was closed and report analytics were updated."
    else:
        raise ValueError(f"Unsupported lifecycle event: {event_type}.")

    ipo.next_action = NEXT_ACTION_BY_STATUS[ipo.lifecycle_status]
    ipo.updated_at = utc_now()
    return _record_event(db, ipo, event_type, message)


def advance_eligible_ipos(db, limit=1):
    candidates = (
        db.query(IPORecord)
        .filter(IPORecord.decision == "ACCEPTED")
        .filter(IPORecord.lifecycle_status.in_(tuple(NEXT_EVENT_BY_STATUS.keys())))
        .order_by(IPORecord.updated_at.asc())
        .limit(limit)
        .all()
    )
    events = []
    for ipo in candidates:
        events.append(advance_lifecycle(db, ipo, "ADVANCE"))
    return events
