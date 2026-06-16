import logging
from fastapi import HTTPException
from growwapi import GrowwAPI

class GrowwAPIClient:
    def __init__(self, jwt_token: str):
        self.jwt_token = jwt_token

    def fetch_holdings(self):
        try:
            groww = GrowwAPI(self.jwt_token)
            holdings_response = groww.get_holdings_for_user(timeout=10)
            
            if not holdings_response or "holdings" not in holdings_response:
                raise HTTPException(status_code=500, detail="Invalid response from Groww API")
                
            return self._normalize_portfolio(holdings_response["holdings"])
        except Exception as e:
            logging.error(f"Groww API fetch_holdings failed: {e}")
            # Raise an explicit HTTP exception so the frontend knows it failed
            raise HTTPException(status_code=500, detail=f"Groww API Error: {str(e)}")

    def _normalize_portfolio(self, holdings):
        if not isinstance(holdings, list):
            return []
            
        normalized = []
        for i, h in enumerate(holdings):
            # Based on the documentation provided
            qty = h.get("quantity", 0)
            avg_price = h.get("average_price", 0)
            current_value = qty * avg_price # Simplified if no live price is attached
            
            normalized.append({
                "id": i + 1,
                "symbol": h.get("trading_symbol", h.get("isin", "UNKNOWN")),
                "company_name": h.get("trading_symbol", "Unknown Share"), # We only have symbol in the payload
                "status": "ALLOTTED",
                "lots": qty,
                "invested": qty * avg_price,
                "current_value": current_value,
                "pnl": 0, # Since we don't have live price in this specific endpoint's schema
                "pnl_percent": 0.0,
                "listing_date": "Historical"
            })
        return normalized

    def get_quote(self, exchange: str, segment: str, trading_symbol: str):
        try:
            groww = GrowwAPI(self.jwt_token)
            return groww.get_quote(exchange=exchange, segment=segment, trading_symbol=trading_symbol)
        except Exception as e:
            logging.error(f"Groww get_quote failed: {e}")
            raise HTTPException(status_code=500, detail=str(e))

    def get_ltp(self, segment: str, symbols: str):
        try:
            groww = GrowwAPI(self.jwt_token)
            return groww.get_ltp(segment=segment, exchange_trading_symbols=symbols)
        except Exception as e:
            logging.error(f"Groww get_ltp failed: {e}")
            raise HTTPException(status_code=500, detail=str(e))

    def get_ohlc(self, segment: str, symbols: str):
        try:
            groww = GrowwAPI(self.jwt_token)
            return groww.get_ohlc(segment=segment, exchange_trading_symbols=symbols)
        except Exception as e:
            logging.error(f"Groww get_ohlc failed: {e}")
            raise HTTPException(status_code=500, detail=str(e))

    def get_option_chain(self, exchange: str, underlying: str, expiry_date: str):
        try:
            groww = GrowwAPI(self.jwt_token)
            return groww.get_option_chain(exchange=exchange, underlying=underlying, expiry_date=expiry_date)
        except Exception as e:
            logging.error(f"Groww get_option_chain failed: {e}")
            raise HTTPException(status_code=500, detail=str(e))

    def get_greeks(self, exchange: str, underlying: str, trading_symbol: str, expiry: str):
        try:
            groww = GrowwAPI(self.jwt_token)
            return groww.get_greeks(exchange=exchange, underlying=underlying, trading_symbol=trading_symbol, expiry=expiry)
        except Exception as e:
            logging.error(f"Groww get_greeks failed: {e}")
            raise HTTPException(status_code=500, detail=str(e))
