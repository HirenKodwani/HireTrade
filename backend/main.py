import asyncio
from collections import Counter
from datetime import datetime
from typing import Optional

from google import genai
import uvicorn
from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from data_aggregator import fetch_news_feed, run_discovery
from database import (
    DecisionConfig,
    IPORecord,
    LifecycleEvent,
    MetricReview,
    NotificationEvent,
    SessionLocal,
    SimulationState,
    SourceHealth,
    init_db,
    utc_now,
)
from lifecycle_engine import advance_eligible_ipos, advance_lifecycle
from validation_engine import evaluate_record, rank_accepted_ipos


app = FastAPI(title="IPO Management Demo API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

runner_task = None


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _json_datetime(value):
    return value.isoformat() if value else None


def _event_payload(event):
    return {
        "id": event.id,
        "event_type": event.event_type,
        "status_after": event.status_after,
        "message": event.message,
        "payload": event.payload or {},
        "created_at": _json_datetime(event.created_at),
    }


def _review_payload(review):
    return {
        "id": review.id,
        "metrics": review.metrics or {},
        "note": review.note or "",
        "created_at": _json_datetime(review.created_at),
    }


def serialize_ipo(db, ipo, include_history=False):
    source_status = sorted(set((ipo.metric_sources or {}).values()))
    payload = {
        "id": ipo.id,
        "symbol": ipo.symbol,
        "company_name": ipo.company_name,
        "open_date": _json_datetime(ipo.open_date),
        "close_date": _json_datetime(ipo.close_date),
        "discovered_at": _json_datetime(ipo.discovered_at),
        "is_sme": bool(ipo.is_sme),
        "current_price": ipo.current_price,
        "pe_ratio": ipo.pe_ratio,
        "revenue_growth_yoy": ipo.revenue_growth_yoy,
        "profit_growth_yoy": ipo.profit_growth_yoy,
        "qib_subscription": ipo.qib_subscription,
        "retail_subscription": ipo.retail_subscription,
        "gmp": ipo.gmp,
        "sentiment_score": ipo.sentiment_score,
        "data_status": ipo.data_status,
        "review_required": bool(ipo.review_required),
        "missing_metrics": ipo.missing_metrics or [],
        "metric_sources": ipo.metric_sources or {},
        "source_status": source_status,
        "decision": ipo.decision,
        "decision_reasons": ipo.decision_reasons or [],
        "decision_score": ipo.decision_score or 0.0,
        "confidence": ipo.confidence or 0.0,
        "recommended_lots": ipo.recommended_lots or 0,
        "comparative_rank": ipo.comparative_rank,
        "lifecycle_status": ipo.lifecycle_status,
        "next_action": ipo.next_action,
        "listing_price": ipo.listing_price,
        "simulated_pnl": ipo.simulated_pnl or 0.0,
        "exit_rationale": ipo.exit_rationale,
        "updated_at": _json_datetime(ipo.updated_at),
    }
    if include_history:
        events = (
            db.query(LifecycleEvent)
            .filter(LifecycleEvent.ipo_id == ipo.id)
            .order_by(LifecycleEvent.created_at.desc())
            .all()
        )
        reviews = (
            db.query(MetricReview)
            .filter(MetricReview.ipo_id == ipo.id)
            .order_by(MetricReview.created_at.desc())
            .all()
        )
        payload["lifecycle_events"] = [_event_payload(event) for event in events]
        payload["reviews"] = [_review_payload(review) for review in reviews]
        payload["source_payload"] = ipo.source_payload or {}
    return payload


def serialize_config(config):
    return {
        "id": config.id,
        "min_decision_age_hours": config.min_decision_age_hours,
        "min_gmp_percent": config.min_gmp_percent,
        "min_qib_sub": config.min_qib_sub,
        "min_retail_sub": config.min_retail_sub,
        "max_pe_ratio": config.max_pe_ratio,
        "min_revenue_yoy": config.min_revenue_yoy,
        "min_profit_yoy": config.min_profit_yoy,
        "min_sentiment": config.min_sentiment,
        "max_fund_allocation_percent": config.max_fund_allocation_percent,
        "max_lots_per_ipo": config.max_lots_per_ipo,
    }


def serialize_runner(state):
    return {
        "enabled": bool(state.enabled),
        "interval_seconds": state.interval_seconds,
        "last_tick_at": _json_datetime(state.last_tick_at),
    }


async def simulation_loop():
    while True:
        await asyncio.sleep(2)
        db = SessionLocal()
        try:
            state = db.query(SimulationState).first()
            if not state or not state.enabled:
                continue
            now = utc_now()
            elapsed = (
                (now - state.last_tick_at).total_seconds()
                if state.last_tick_at
                else state.interval_seconds
            )
            if elapsed < state.interval_seconds:
                continue
            advance_eligible_ipos(db)
            state.last_tick_at = now
            db.commit()
        except Exception:
            db.rollback()
        finally:
            db.close()


@app.on_event("startup")
async def on_startup():
    init_db()
    db = SessionLocal()
    try:
        # Ensure config has sensible defaults (update old restrictive thresholds)
        config = db.query(DecisionConfig).first()
        if config:
            if config.min_sentiment >= 50.0:
                config.min_sentiment = 20.0
            if config.min_gmp_percent >= 10.0:
                config.min_gmp_percent = 5.0
            if config.min_qib_sub >= 2.0:
                config.min_qib_sub = 1.0
            if config.min_retail_sub >= 1.0:
                config.min_retail_sub = 0.5
            if config.min_revenue_yoy >= 5.0:
                config.min_revenue_yoy = 2.0
            if config.min_profit_yoy >= 5.0:
                config.min_profit_yoy = 2.0
        for ipo in db.query(IPORecord).all():
            evaluate_record(db, ipo)
        rank_accepted_ipos(db)
        db.commit()
    finally:
        db.close()
    global runner_task
    if runner_task is None or runner_task.done():
        runner_task = asyncio.create_task(simulation_loop())


@app.on_event("shutdown")
async def on_shutdown():
    global runner_task
    if runner_task and not runner_task.done():
        runner_task.cancel()
    runner_task = None


class ConfigUpdate(BaseModel):
    min_decision_age_hours: Optional[float] = None
    min_gmp_percent: Optional[float] = None
    min_qib_sub: Optional[float] = None
    min_retail_sub: Optional[float] = None
    max_pe_ratio: Optional[float] = None
    min_revenue_yoy: Optional[float] = None
    min_profit_yoy: Optional[float] = None
    min_sentiment: Optional[float] = None
    max_fund_allocation_percent: Optional[float] = None
    max_lots_per_ipo: Optional[int] = None


class MetricReviewUpdate(BaseModel):
    current_price: Optional[float] = None
    gmp: Optional[float] = None
    qib_subscription: Optional[float] = None
    retail_subscription: Optional[float] = None
    pe_ratio: Optional[float] = None
    revenue_growth_yoy: Optional[float] = None
    profit_growth_yoy: Optional[float] = None
    sentiment_score: Optional[float] = None
    note: str = ""


class SimulationEventRequest(BaseModel):
    event_type: str = Field(default="ADVANCE")


class SimulationRunnerUpdate(BaseModel):
    enabled: Optional[bool] = None
    interval_seconds: Optional[int] = Field(default=None, ge=3, le=3600)
    advance_now: bool = False


@app.get("/api/ipos")
def get_ipos(db: Session = Depends(get_db)):
    records = db.query(IPORecord).order_by(IPORecord.updated_at.desc()).all()
    return [serialize_ipo(db, record) for record in records]


@app.get("/api/ipos/{ipo_id}")
def get_ipo_detail(ipo_id: int, db: Session = Depends(get_db)):
    ipo = db.query(IPORecord).filter(IPORecord.id == ipo_id).first()
    if not ipo:
        raise HTTPException(status_code=404, detail="IPO not found")
    return serialize_ipo(db, ipo, include_history=True)


@app.get("/api/config")
def get_config(db: Session = Depends(get_db)):
    config = db.query(DecisionConfig).first()
    if not config:
        config = DecisionConfig()
        db.add(config)
        db.commit()
        db.refresh(config)
    return serialize_config(config)


@app.post("/api/config")
def update_config(config_data: ConfigUpdate, db: Session = Depends(get_db)):
    config = db.query(DecisionConfig).first()
    if not config:
        config = DecisionConfig()
        db.add(config)
    for key, value in config_data.model_dump(exclude_none=True).items():
        setattr(config, key, value)
    for ipo in db.query(IPORecord).all():
        evaluate_record(db, ipo)
    rank_accepted_ipos(db)
    db.commit()
    db.refresh(config)
    return {"status": "success", "config": serialize_config(config)}


@app.post("/api/discovery/run")
def run_discovery_endpoint():
    return run_discovery()


@app.post("/api/trigger_discovery")
def trigger_discovery():
    return run_discovery()


@app.get("/api/sources/health")
def get_source_health(db: Session = Depends(get_db)):
    items = db.query(SourceHealth).order_by(SourceHealth.source_name.asc()).all()
    return [
        {
            "source_name": item.source_name,
            "status": item.status,
            "message": item.message,
            "records_seen": item.records_seen,
            "last_attempt_at": _json_datetime(item.last_attempt_at),
            "last_success_at": _json_datetime(item.last_success_at),
        }
        for item in items
    ]


@app.post("/api/ipos/{ipo_id}/review-metrics")
def review_metrics(
    ipo_id: int, review_data: MetricReviewUpdate, db: Session = Depends(get_db)
):
    ipo = db.query(IPORecord).filter(IPORecord.id == ipo_id).first()
    if not ipo:
        raise HTTPException(status_code=404, detail="IPO not found")

    values = review_data.model_dump(exclude_none=True)
    note = values.pop("note", "")
    if not values:
        raise HTTPException(status_code=422, detail="At least one metric is required")

    metric_sources = dict(ipo.metric_sources or {})
    for field, value in values.items():
        setattr(ipo, field, value)
        metric_sources[field] = "review"
    ipo.metric_sources = metric_sources
    ipo.updated_at = utc_now()
    db.add(MetricReview(ipo_id=ipo.id, metrics=values, note=note))
    evaluate_record(db, ipo)
    rank_accepted_ipos(db)
    db.commit()
    db.refresh(ipo)
    return serialize_ipo(db, ipo, include_history=True)


@app.post("/api/ipos/{ipo_id}/revalidate")
def revalidate_ipo(ipo_id: int, db: Session = Depends(get_db)):
    ipo = db.query(IPORecord).filter(IPORecord.id == ipo_id).first()
    if not ipo:
        raise HTTPException(status_code=404, detail="IPO not found")
    result = evaluate_record(db, ipo)
    rank_accepted_ipos(db)
    db.commit()
    db.refresh(ipo)
    return {"result": result, "ipo": serialize_ipo(db, ipo, include_history=True)}


@app.post("/api/ipos/{ipo_id}/simulate-event")
def simulate_event(
    ipo_id: int, event_data: SimulationEventRequest, db: Session = Depends(get_db)
):
    ipo = db.query(IPORecord).filter(IPORecord.id == ipo_id).first()
    if not ipo:
        raise HTTPException(status_code=404, detail="IPO not found")
    try:
        event = advance_lifecycle(db, ipo, event_data.event_type)
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    db.commit()
    db.refresh(event)
    db.refresh(ipo)
    return {"event": _event_payload(event), "ipo": serialize_ipo(db, ipo, True)}


@app.get("/api/simulation/runner")
def get_simulation_runner(db: Session = Depends(get_db)):
    state = db.query(SimulationState).first()
    return serialize_runner(state)


@app.post("/api/simulation/runner")
def update_simulation_runner(
    runner_data: SimulationRunnerUpdate, db: Session = Depends(get_db)
):
    state = db.query(SimulationState).first()
    if not state:
        state = SimulationState()
        db.add(state)
        db.flush()
    values = runner_data.model_dump(exclude_none=True)
    advance_now = values.pop("advance_now", False)
    for key, value in values.items():
        setattr(state, key, value)
    events = advance_eligible_ipos(db) if advance_now else []
    if advance_now:
        state.last_tick_at = utc_now()
    db.commit()
    db.refresh(state)
    return {
        "runner": serialize_runner(state),
        "events": [_event_payload(event) for event in events],
    }


@app.get("/api/analytics")
def get_analytics(db: Session = Depends(get_db)):
    ipos = db.query(IPORecord).all()
    decision_counts = Counter(ipo.decision for ipo in ipos)
    lifecycle_counts = Counter(ipo.lifecycle_status for ipo in ipos)
    event_counts = Counter(
        event_type for (event_type,) in db.query(LifecycleEvent.event_type).all()
    )
    closed = [ipo for ipo in ipos if ipo.lifecycle_status == "CLOSED"]
    pnl_total = round(sum(ipo.simulated_pnl or 0.0 for ipo in closed), 2)
    winning_closed = len([ipo for ipo in closed if (ipo.simulated_pnl or 0.0) > 0])
    past_trades = [
        {
            "symbol": ipo.symbol,
            "company_name": ipo.company_name,
            "status": ipo.lifecycle_status,
            "lots": ipo.recommended_lots or 0,
            "pnl": ipo.simulated_pnl or 0.0,
            "date": _json_datetime(ipo.updated_at),
        }
        for ipo in sorted(closed, key=lambda item: item.updated_at or datetime.min, reverse=True)
    ][:8]
    return {
        "decision_counts": dict(decision_counts),
        "lifecycle_counts": dict(lifecycle_counts),
        "total_pnl": pnl_total,
        "win_rate": round((winning_closed / len(closed)) * 100) if closed else 0,
        "closed_trades": len(closed),
        "application_simulations": event_counts.get("APPLY", 0),
        "allotment_simulations": event_counts.get("ALLOT", 0),
        "past_trades": past_trades,
    }


@app.get("/api/news")
def get_news():
    return fetch_news_feed()


@app.get("/api/notifications")
def get_notifications(db: Session = Depends(get_db)):
    notifications = (
        db.query(NotificationEvent)
        .order_by(NotificationEvent.created_at.desc())
        .limit(12)
        .all()
    )
    return [
        {
            "id": item.id,
            "ipo_id": item.ipo_id,
            "level": item.level,
            "title": item.title,
            "message": item.message,
            "created_at": _json_datetime(item.created_at),
        }
        for item in notifications
    ]


class CopilotQuery(BaseModel):
    message: str
    ipo_id: Optional[int] = None

@app.post("/api/copilot")
def copilot_query(query: CopilotQuery, db: Session = Depends(get_db)):
    """Generative copilot using Gemini."""
    ipo = None
    ipo_context = "No specific IPO context provided. Provide general market analysis or explain IPO metrics."
    if query.ipo_id:
        ipo = db.query(IPORecord).filter(IPORecord.id == query.ipo_id).first()
        if ipo:
            ipo_context = (
                f"IPO Name: {ipo.company_name}\n"
                f"Current Decision: {ipo.decision}\n"
                f"AI Score: {ipo.decision_score}\n"
                f"Confidence: {ipo.confidence}%\n"
                f"Reasons: {', '.join(ipo.decision_reasons)}\n"
                f"Metrics: GMP={ipo.gmp}, QIB Sub={ipo.qib_subscription}, PE={ipo.pe_ratio}"
            )

    prompt = (
        "You are the AI Market Analyst for HireTrade, an advanced IPO intelligence platform. "
        "Keep your response concise, professional, and conversational. Do not use generic filler. "
        f"Context regarding the user's current IPO: \n{ipo_context}\n\n"
        f"User Query: {query.message}"
    )

    try:
        if GLOBAL_GEMINI_KEY:
            client = genai.Client(api_key=GLOBAL_GEMINI_KEY)
            response = client.models.generate_content(model="gemini-2.5-flash", contents=prompt)
            reply = response.text
        else:
            raise Exception("No Gemini API Key provided")
    except Exception as e:
        msg = query.message.lower()
        if "should i apply" in msg or "verdict" in msg:
            if ipo:
                if ipo.decision == "ACCEPTED":
                    reply = f"Yes, my AI model flags {ipo.company_name} as a strong APPLY. It passed all validation thresholds."
                elif ipo.decision == "REJECTED":
                    reply = f"I recommend avoiding {ipo.company_name}. My analysis shows it failed validation: {', '.join(ipo.decision_reasons)}."
                else:
                    reply = f"{ipo.company_name} is currently under review."
            else:
                reply = "Please specify an IPO or ask this from an IPO's detail page so I can check my analysis."
        elif "explain gmp" in msg:
            reply = "GMP (Grey Market Premium) is the unofficial premium at which IPO shares trade before listing. A high GMP suggests strong listing gains."
        elif "why did ai reject" in msg:
            if ipo and ipo.decision == "REJECTED":
                reply = f"I rejected {ipo.company_name} due to these critical flags: {', '.join(ipo.decision_reasons)}."
            elif ipo:
                reply = f"Actually, I did not reject {ipo.company_name}. Its current status is {ipo.decision}."
            else:
                reply = "I need to know which IPO you are asking about."
        else:
            if ipo:
                reply = f"I am analyzing {ipo.company_name}. Currently, it has a decision score of {ipo.decision_score} and confidence of {ipo.confidence}%."
            else:
                reply = "I am the AI Market Analyst. I'm currently running in deterministic mode. Ask me about specific IPOs, GMP trends, or my reasoning for any application decision!"

    return {"reply": reply}




# Mock Angel One Smart API & Portfolio Endpoints

MOCK_PORTFOLIO = []

GLOBAL_BROKER_CONFIG = {"broker": "Groww", "api_key": "eyJraWQiOiJaTUtjVXciLCJhbGciOiJFUzI1NiJ9.eyJleHAiOjI1NzAwMjk0MjcsImlhdCI6MTc4MTYyOTQyNywibmJmIjoxNzgxNjI5NDI3LCJzdWIiOiJ7XCJ0b2tlblJlZklkXCI6XCJkOGUxYjlkYi01Y2YwLTQ1YWEtODFhZS1kZTViZjMyNGNkNzJcIixcInZlbmRvckludGVncmF0aW9uS2V5XCI6XCJlMzFmZjIzYjA4NmI0MDZjODg3NGIyZjZkODQ5NTMxM1wiLFwidXNlckFjY291bnRJZFwiOlwiMGUzY2RiZDItODM3MC00YzFmLTlmYjctNzk1NDNkZTBmNmE5XCIsXCJkZXZpY2VJZFwiOlwiYjg0M2Y2YjMtMzc5MS01YWQ2LWEyYzQtYjJlY2Y2MWQ3ZGU5XCIsXCJzZXNzaW9uSWRcIjpcImUxYmEyYzYxLTM5ZmEtNGQ5Ny1hMTcxLWRkMzkyNGE3ODM0ZFwiLFwiYWRkaXRpb25hbERhdGFcIjpcIno1NC9NZzltdjE2WXdmb0gvS0EwYlBtb1U5RnFMR1lJOUVGQ00yZWdvUFZSTkczdTlLa2pWZDNoWjU1ZStNZERhWXBOVi9UOUxIRmtQejFFQisybTdRPT1cIixcInJvbGVcIjpcImF1dGgtdG90cFwiLFwic291cmNlSXBBZGRyZXNzXCI6XCIxMDYuMjE5Ljg2LjQyLDE3Mi42OC4xNDYuMjAxLDM1LjI0MS4yMy4xMjNcIixcInR3b0ZhRXhwaXJ5VHNcIjoyNTcwMDI5NDI3NzA1LFwidmVuZG9yTmFtZVwiOlwiZ3Jvd3dBcGlcIn0iLCJpc3MiOiJhcGV4LWF1dGgtcHJvZC1hcHAifQ.BjlPbarLg-ImAS1HLfJsi2JZqy79YMvKOS3vv5ocxLzJjeYEjZ5p3Y06pOaEjcH3lbGnXz3wzgsO2oy9SWZsKA", "client_id": "", "pan_number": ""}
GLOBAL_GEMINI_KEY = ""

class BrokerLoginReq(BaseModel):
    broker: str
    client_id: str
    api_key: str
    gemini_key: Optional[str] = None
    pan_number: Optional[str] = None

@app.post("/api/broker/login")
def broker_login(req: BrokerLoginReq):
    global GLOBAL_GEMINI_KEY
    GLOBAL_BROKER_CONFIG["broker"] = req.broker
    GLOBAL_BROKER_CONFIG["client_id"] = req.client_id
    GLOBAL_BROKER_CONFIG["api_key"] = req.api_key
    if req.pan_number:
        GLOBAL_BROKER_CONFIG["pan_number"] = req.pan_number
    if req.gemini_key:
        GLOBAL_GEMINI_KEY = req.gemini_key
    return {"status": "success", "message": f"Connected to {req.broker} API"}

from groww_adapter import GrowwAPIClient

@app.get("/api/portfolio")
def get_portfolio():
    broker = GLOBAL_BROKER_CONFIG["broker"]
    api_key = GLOBAL_BROKER_CONFIG["api_key"]
    if broker == "Groww":
        if not api_key:
            raise HTTPException(status_code=401, detail="Groww API Key missing. Please set it in Settings.")
        client = GrowwAPIClient(api_key)
        return client.fetch_holdings()
    else:
        # Strict NO FAKE DATA rule applied
        return []

@app.get("/api/live/quote")
def get_live_quote(exchange: str, segment: str, trading_symbol: str):
    api_key = GLOBAL_BROKER_CONFIG["api_key"]
    if not api_key:
        raise HTTPException(status_code=401, detail="Groww API Key missing")
    client = GrowwAPIClient(api_key)
    return client.get_quote(exchange, segment, trading_symbol)

@app.get("/api/live/ltp")
def get_live_ltp(segment: str, symbols: str):
    api_key = GLOBAL_BROKER_CONFIG["api_key"]
    if not api_key:
        raise HTTPException(status_code=401, detail="Groww API Key missing")
    client = GrowwAPIClient(api_key)
    return client.get_ltp(segment, symbols)

@app.get("/api/live/ohlc")
def get_live_ohlc(segment: str, symbols: str):
    api_key = GLOBAL_BROKER_CONFIG["api_key"]
    if not api_key:
        raise HTTPException(status_code=401, detail="Groww API Key missing")
    client = GrowwAPIClient(api_key)
    return client.get_ohlc(segment, symbols)

@app.get("/api/live/option_chain")
def get_live_option_chain(exchange: str, underlying: str, expiry_date: str):
    api_key = GLOBAL_BROKER_CONFIG["api_key"]
    if not api_key:
        raise HTTPException(status_code=401, detail="Groww API Key missing")
    client = GrowwAPIClient(api_key)
    return client.get_option_chain(exchange, underlying, expiry_date)

@app.get("/api/broker/status")
def broker_status():
    return {"connected": bool(GLOBAL_BROKER_CONFIG["api_key"]), "broker": GLOBAL_BROKER_CONFIG["broker"], "balance": 150000 if GLOBAL_BROKER_CONFIG["api_key"] else 0}

class BrokerApplyRequest(BaseModel):
    ipo_id: int
    lots: int
    upi_id: str

@app.post("/api/broker/apply")
def broker_apply(req: BrokerApplyRequest, db: Session = Depends(get_db)):
    ipo = db.query(IPORecord).filter(IPORecord.id == req.ipo_id).first()
    if not ipo:
        raise HTTPException(404, "IPO not found")
        
    return {
        "status": "success", 
        "application_no": f"ANGEL{req.ipo_id}0091", 
        "message": f"Successfully applied for {req.lots} lots of {ipo.company_name}."
    }

class AllotmentCheckReq(BaseModel):
    ipo_id: int

@app.post("/api/allotment/check")
def check_allotment(req: AllotmentCheckReq, db: Session = Depends(get_db)):
    pan_number = GLOBAL_BROKER_CONFIG.get("pan_number")
    if not pan_number:
        raise HTTPException(status_code=400, detail="PAN Number not configured. Please add it in Settings.")
        
    ipo = db.query(IPORecord).filter(IPORecord.id == req.ipo_id).first()
    if not ipo:
        raise HTTPException(status_code=404, detail="IPO not found")
        
    # Simulated Allotment Checker Engine
    # In a real environment, this would hit KFintech/LinkIntime via a proxy or captcha-solving service
    import time
    time.sleep(1.5) # Simulate API call latency
    
    # Deterministic simulation based on IPO ID to show consistent results
    status_code = req.ipo_id % 3
    if status_code == 0:
        status = "ALLOTTED"
        message = f"Congratulations! You have been allotted 1 lot of {ipo.company_name}."
    elif status_code == 1:
        status = "NOT_ALLOTTED"
        message = f"Sorry, you were not allotted any shares for {ipo.company_name}."
    else:
        status = "PENDING"
        message = f"The allotment for {ipo.company_name} is not out yet or is currently pending."
        
    return {
        "status": "success",
        "allotment_status": status,
        "message": message,
        "pan_checked": pan_number,
        "registrar": "Simulated (KFintech/LinkIntime Adapter)"
    }


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
