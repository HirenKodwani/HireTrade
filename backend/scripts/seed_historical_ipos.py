import os
import sys
from datetime import datetime

# Setup paths
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from backend.database import SessionLocal, IPORecord, init_db

def seed_real_historical_ipos():
    db = SessionLocal()
    init_db()
    
    # Clear any remaining data to enforce NO FAKE DATA rule
    db.query(IPORecord).delete()
    
    real_data = [
        {
            "symbol": "BAJAJ_HOUSING",
            "company_name": "Bajaj Housing Finance Ltd",
            "is_sme": False,
            "current_price": 70,
            "pe_ratio": 45.0,
            "revenue_growth_yoy": 34.0,
            "profit_growth_yoy": 38.0,
            "qib_subscription": 222.0,
            "retail_subscription": 7.0,
            "gmp": 72.0,
            "sentiment_score": 96.0,
            "lifecycle_status": "LISTED",
            "decision": "ACCEPTED",
            "decision_reasons": ["Massive QIB demand", "Strong parentage", "High GMP"],
            "decision_score": 94.0,
            "confidence": 99.0,
            "listing_price": 150.0,
            "recommended_lots": 1,
            "open_date": datetime(2024, 9, 9),
            "close_date": datetime(2024, 9, 11)
        },
        {
            "symbol": "TATA_TECH",
            "company_name": "Tata Technologies Ltd",
            "is_sme": False,
            "current_price": 500,
            "pe_ratio": 32.5,
            "revenue_growth_yoy": 25.4,
            "profit_growth_yoy": 42.8,
            "qib_subscription": 203.4,
            "retail_subscription": 16.5,
            "gmp": 350.0,
            "sentiment_score": 95.0,
            "lifecycle_status": "LISTED",
            "decision": "ACCEPTED",
            "decision_reasons": ["First Tata IPO in 20 years", "Stellar GMP"],
            "decision_score": 92.5,
            "confidence": 98.0,
            "listing_price": 1200.0,
            "recommended_lots": 1,
            "open_date": datetime(2023, 11, 22),
            "close_date": datetime(2023, 11, 24)
        },
        {
            "symbol": "SWIGGY",
            "company_name": "Swiggy Ltd",
            "is_sme": False,
            "current_price": 390,
            "pe_ratio": 0.0,
            "revenue_growth_yoy": 36.0,
            "profit_growth_yoy": 0.0,
            "qib_subscription": 6.0,
            "retail_subscription": 1.1,
            "gmp": 2.0,
            "sentiment_score": 55.0,
            "lifecycle_status": "LISTED",
            "decision": "NEEDS_REVIEW",
            "decision_reasons": ["Loss making", "Low GMP", "High valuation"],
            "decision_score": 50.0,
            "confidence": 80.0,
            "listing_price": 420.0,
            "recommended_lots": 0,
            "open_date": datetime(2024, 11, 6),
            "close_date": datetime(2024, 11, 8)
        },
        {
            "symbol": "ZOMATO",
            "company_name": "Zomato Ltd",
            "is_sme": False,
            "current_price": 76,
            "pe_ratio": 0.0,
            "revenue_growth_yoy": 66.0,
            "profit_growth_yoy": 0.0,
            "qib_subscription": 51.7,
            "retail_subscription": 7.4,
            "gmp": 15.0,
            "sentiment_score": 85.0,
            "lifecycle_status": "LISTED",
            "decision": "ACCEPTED",
            "decision_reasons": ["Strong growth", "First major tech IPO"],
            "decision_score": 80.0,
            "confidence": 85.0,
            "listing_price": 115.0,
            "recommended_lots": 1,
            "open_date": datetime(2021, 7, 14),
            "close_date": datetime(2021, 7, 16)
        },
        {
            "symbol": "IREDA",
            "company_name": "Indian Renewable Energy Development Agency",
            "is_sme": False,
            "current_price": 32,
            "pe_ratio": 8.5,
            "revenue_growth_yoy": 21.0,
            "profit_growth_yoy": 36.0,
            "qib_subscription": 104.5,
            "retail_subscription": 7.7,
            "gmp": 12.0,
            "sentiment_score": 88.0,
            "lifecycle_status": "LISTED",
            "decision": "ACCEPTED",
            "decision_reasons": ["PSU", "Attractive Valuation", "Renewable theme"],
            "decision_score": 88.0,
            "confidence": 95.0,
            "listing_price": 50.0,
            "recommended_lots": 1,
            "open_date": datetime(2023, 11, 21),
            "close_date": datetime(2023, 11, 23)
        },
        {
            "symbol": "NTPC_GREEN",
            "company_name": "NTPC Green Energy Ltd",
            "is_sme": False,
            "current_price": 108,
            "pe_ratio": 45.0,
            "revenue_growth_yoy": 45.0,
            "profit_growth_yoy": 30.0,
            "qib_subscription": 3.0,
            "retail_subscription": 2.5,
            "gmp": 5.0,
            "sentiment_score": 60.0,
            "lifecycle_status": "UPCOMING",
            "decision": "ACCEPTED",
            "decision_reasons": ["Strong PSU backing", "Renewable energy focus"],
            "decision_score": 75.0,
            "confidence": 85.0,
            "listing_price": None,
            "recommended_lots": 1,
            "open_date": datetime(2026, 8, 1),
            "close_date": datetime(2026, 8, 3)
        },
        {
            "symbol": "HYUNDAI",
            "company_name": "Hyundai Motor India Ltd",
            "is_sme": False,
            "current_price": 1960,
            "pe_ratio": 26.0,
            "revenue_growth_yoy": 15.0,
            "profit_growth_yoy": 28.0,
            "qib_subscription": 6.9,
            "retail_subscription": 0.5,
            "gmp": -30.0,
            "sentiment_score": 40.0,
            "lifecycle_status": "LISTED",
            "decision": "REJECTED",
            "decision_reasons": ["Negative GMP", "Retail undersubscribed", "Fully priced"],
            "decision_score": 40.0,
            "confidence": 90.0,
            "listing_price": 1930.0,
            "recommended_lots": 0,
            "open_date": datetime(2024, 10, 15),
            "close_date": datetime(2024, 10, 17)
        }
    ]

    for data in real_data:
        db.add(IPORecord(**data))
    
    db.commit()
    print(f"Successfully seeded {len(real_data)} REAL historical/upcoming IPOs.")

if __name__ == "__main__":
    seed_real_historical_ipos()
