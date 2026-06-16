import random
import re
from datetime import datetime
from email.utils import parsedate_to_datetime

from curl_cffi import requests
from bs4 import BeautifulSoup


USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/124.0.0.0 Safari/537.36"
)


def canonical_key(value):
    cleaned = re.sub(r"[^a-z0-9]+", "-", (value or "").lower()).strip("-")
    return cleaned or "unknown-ipo"


def parse_number(value):
    if value is None:
        return None
    text = str(value).replace(",", "").replace("%", "").strip()
    match = re.search(r"-?\d+(?:\.\d+)?", text)
    return float(match.group()) if match else None


def parse_date(value):
    if not value:
        return None
    text = re.sub(r"\s+", " ", str(value)).strip()
    formats = (
        "%d-%b-%Y",
        "%d %b %Y",
        "%d/%m/%Y",
        "%Y-%m-%d",
        "%b %d, %Y",
        "%d-%m-%Y",
    )
    for date_format in formats:
        try:
            return datetime.strptime(text, date_format)
        except ValueError:
            continue
    return None


def _headers():
    return {
        "User-Agent": USER_AGENT,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-IN,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "Connection": "keep-alive",
    }


# ─────────────────────────────────────────────────────────────────────────────
# 1. IPO Watch — GMP + price (primary source for GMP data)
# ─────────────────────────────────────────────────────────────────────────────

class IPOWatchGMPAdapter:
    name = "IPO Watch GMP"
    url = "https://ipowatch.in/ipo-grey-market-premium-latest-ipo-gmp/"

    def fetch(self):
        response = requests.get(self.url, headers=_headers(), timeout=12)
        response.raise_for_status()
        soup = BeautifulSoup(response.content, "html.parser")
        table = soup.select_one("figure.wp-block-table table") or soup.find("table")
        if not table:
            return []

        records = []
        for row in table.find_all("tr")[1:30]:
            cells = [cell.get_text(" ", strip=True) for cell in row.find_all("td")]
            if len(cells) < 3:
                continue
            company_name = cells[0]
            gmp = parse_number(cells[1])
            price = parse_number(cells[3]) if len(cells) > 3 else None
            if not company_name or price is None:
                continue

            record = {
                "key": canonical_key(company_name),
                "symbol": company_name,
                "company_name": company_name,
                "current_price": price,
                "gmp": gmp,
                "is_sme": "SME" in company_name.upper(),
                "raw": {"price": cells[3] if len(cells) > 3 else "", "gmp": cells[1]},
            }
            records.append(record)
        return records


# ─────────────────────────────────────────────────────────────────────────────
# 2. Chittorgarh — Live IPO subscription data (most comprehensive Indian source)
# ─────────────────────────────────────────────────────────────────────────────

class ChittorgarhSubscriptionAdapter:
    name = "Chittorgarh Subscription"
    # Live subscription status page
    SUBSCRIPTION_URL = "https://www.chittorgarh.com/report/ipo-subscription-status-live-bidding-detail/81/"
    # IPO list page for pricing/dates
    IPO_LIST_URL = "https://www.chittorgarh.com/report/latest-ipo-allotment-subscription-listing-issue-price/83/"

    def fetch(self):
        records = {}

        # First pass: subscription data
        try:
            sub_records = self._fetch_subscription()
            for r in sub_records:
                records[r["key"]] = r
        except Exception:
            pass

        # Second pass: IPO list for price, dates, PE
        try:
            list_records = self._fetch_ipo_list()
            for r in list_records:
                key = r["key"]
                if key in records:
                    # Merge — don't overwrite subscription data
                    for field, value in r.items():
                        if field not in records[key] or records[key][field] is None:
                            records[key][field] = value
                else:
                    records[key] = r
        except Exception:
            pass

        return list(records.values())

    def _fetch_subscription(self):
        resp = requests.get(self.SUBSCRIPTION_URL, headers=_headers(), timeout=12, impersonate='chrome110')
        resp.raise_for_status()
        soup = BeautifulSoup(resp.content, "html.parser")

        records = []
        table = soup.find("table")
        if not table:
            return records

        rows = table.find_all("tr")
        if len(rows) < 2:
            return records

        headers = [
            th.get_text(" ", strip=True).lower()
            for th in rows[0].find_all(["th", "td"])
        ]

        for row in rows[1:50]:
            cells = [td.get_text(" ", strip=True) for td in row.find_all("td")]
            if len(cells) < 3:
                continue
            data = dict(zip(headers, cells))

            company = self._pick(data, ("ipo name", "company", "ipo", "issue"))
            if not company or len(company) < 3:
                continue

            qib = parse_number(self._pick(data, ("qib",)))
            nii = parse_number(self._pick(data, ("nii", "hni")))
            rii = parse_number(self._pick(data, ("rii", "retail")))
            total = parse_number(self._pick(data, ("total", "overall", "times")))

            # Use total subscription as proxy for sentiment (cap at 100)
            sentiment = None
            if total is not None:
                sentiment = min(100.0, round(total * 3, 2))  # oversubscribed = positive

            record = {
                "key": canonical_key(company),
                "symbol": company,
                "company_name": company,
                "raw": data,
            }
            if qib is not None:
                record["qib_subscription"] = qib
            if rii is not None:
                record["retail_subscription"] = rii
            elif nii is not None:
                record["retail_subscription"] = nii
            if sentiment is not None:
                record["sentiment_score"] = sentiment
            records.append(record)

        return records

    def _fetch_ipo_list(self):
        resp = requests.get(self.IPO_LIST_URL, headers=_headers(), timeout=12, impersonate='chrome110')
        resp.raise_for_status()
        soup = BeautifulSoup(resp.content, "html.parser")

        records = []
        table = soup.find("table")
        if not table:
            return records

        rows = table.find_all("tr")
        if len(rows) < 2:
            return records

        headers = [
            th.get_text(" ", strip=True).lower()
            for th in rows[0].find_all(["th", "td"])
        ]

        for row in rows[1:60]:
            cells = [td.get_text(" ", strip=True) for td in row.find_all("td")]
            if len(cells) < 2:
                continue
            data = dict(zip(headers, cells))

            company = self._pick(data, ("ipo name", "company", "issue", "name"))
            if not company or len(company) < 3:
                continue

            price_text = self._pick(data, ("issue price", "price band", "price"))
            # Price band like "100-110" — take the upper bound
            price = None
            if price_text:
                numbers = re.findall(r"\d+(?:\.\d+)?", price_text.replace(",", ""))
                if numbers:
                    price = float(numbers[-1])

            open_d = parse_date(self._pick(data, ("open", "start date", "open date")))
            close_d = parse_date(self._pick(data, ("close", "end date", "close date")))

            record = {
                "key": canonical_key(company),
                "symbol": company,
                "company_name": company,
                "is_sme": "SME" in " ".join(cells).upper(),
                "raw": data,
            }
            if price:
                record["current_price"] = price
            if open_d:
                record["open_date"] = open_d
            if close_d:
                record["close_date"] = close_d
            records.append(record)

        return records

    @staticmethod
    def _pick(data, fragments):
        for key, value in data.items():
            for frag in fragments:
                if frag in key:
                    return value
        return None


# ─────────────────────────────────────────────────────────────────────────────
# 3. InvestorGain — subscription + GMP data
# ─────────────────────────────────────────────────────────────────────────────

class InvestorGainAdapter:
    name = "InvestorGain IPO Data"
    url = "https://www.investorgain.com/report/live-ipo-gmp/331/"

    def fetch(self):
        resp = requests.get(self.url, headers=_headers(), timeout=12, impersonate='chrome110')
        resp.raise_for_status()
        soup = BeautifulSoup(resp.content, "html.parser")

        records = []
        table = soup.find("table")
        if not table:
            return records

        rows = table.find_all("tr")
        if len(rows) < 2:
            return records

        headers = [
            th.get_text(" ", strip=True).lower()
            for th in rows[0].find_all(["th", "td"])
        ]

        for row in rows[1:40]:
            cells = [td.get_text(" ", strip=True) for td in row.find_all("td")]
            if len(cells) < 3:
                continue
            data = dict(zip(headers, cells))

            company = self._pick(data, ("ipo", "company", "name"))
            if not company or len(company) < 3:
                continue

            price = parse_number(self._pick(data, ("price", "issue")))
            gmp = parse_number(self._pick(data, ("gmp",)))
            est = parse_number(self._pick(data, ("est listing", "listing")))
            subs = parse_number(self._pick(data, ("subscription", "subscribed", "times")))

            record = {
                "key": canonical_key(company),
                "symbol": company,
                "company_name": company,
                "raw": data,
            }
            if price:
                record["current_price"] = price
            if gmp is not None:
                record["gmp"] = gmp
            if subs is not None:
                record["qib_subscription"] = subs
                record["sentiment_score"] = min(100.0, round(subs * 2.5, 2))
            records.append(record)

        return records

    @staticmethod
    def _pick(data, fragments):
        for key, value in data.items():
            for frag in fragments:
                if frag in key:
                    return value
        return None


# ─────────────────────────────────────────────────────────────────────────────
# 4. NSE / BSE exchange table adapters
# ─────────────────────────────────────────────────────────────────────────────

class ExchangeTableAdapter:
    def __init__(self, name, url):
        self.name = name
        self.url = url

    def fetch(self):
        response = requests.get(self.url, headers=_headers(), timeout=12)
        response.raise_for_status()
        soup = BeautifulSoup(response.content, "html.parser")
        records = []
        for table in soup.find_all("table"):
            rows = table.find_all("tr")
            if len(rows) < 2:
                continue
            headers = [
                cell.get_text(" ", strip=True).lower()
                for cell in rows[0].find_all(["th", "td"])
            ]
            if not any("issue" in h or "company" in h for h in headers):
                continue
            for row in rows[1:50]:
                values = [cell.get_text(" ", strip=True) for cell in row.find_all("td")]
                if len(values) != len(headers):
                    continue
                record = self._record_from_row(headers, values)
                if record:
                    records.append(record)
        return records

    def _record_from_row(self, headers, values):
        row = dict(zip(headers, values))
        company_name = self._pick(row, ("issue", "company", "issuer"))
        if not company_name:
            return None

        record = {
            "key": canonical_key(company_name),
            "symbol": company_name,
            "company_name": company_name,
            "is_sme": "SME" in " ".join(values).upper(),
            "raw": row,
        }
        record["open_date"] = parse_date(self._pick(row, ("open", "start")))
        record["close_date"] = parse_date(self._pick(row, ("close", "end")))

        # Price band "100 to 110" or "100-110" → take upper bound
        price_text = self._pick(row, ("price", "band"))
        if price_text:
            nums = re.findall(r"\d+(?:\.\d+)?", price_text.replace(",", ""))
            record["current_price"] = float(nums[-1]) if nums else None
        record["qib_subscription"] = parse_number(self._pick(row, ("qib",)))
        record["retail_subscription"] = parse_number(self._pick(row, ("retail", "rii")))
        return {k: v for k, v in record.items() if v is not None}

    @staticmethod
    def _pick(row, fragments):
        for header, value in row.items():
            if any(fragment in header for fragment in fragments):
                return value
        return None


class NSEIssueAdapter(ExchangeTableAdapter):
    def __init__(self):
        super().__init__(
            "NSE IPO Issues",
            "https://www.nseindia.com/market-data/all-upcoming-issues-ipo",
        )


class BSEIssueAdapter(ExchangeTableAdapter):
    def __init__(self):
        super().__init__(
            "BSE Public Issues",
            "https://www.bseindia.com/markets/PublicIssues/IPOIssues_new.aspx?id=1&Type=p",
        )


# ─────────────────────────────────────────────────────────────────────────────
# 5. yfinance enrichment — PE ratio, revenue/profit growth for listed companies
# ─────────────────────────────────────────────────────────────────────────────

class YFinanceEnrichmentAdapter:
    """Enrich already-discovered IPO records with fundamental data via yfinance."""
    name = "yfinance Fundamentals"

    # Well-known upcoming Indian IPOs and their NSE tickers (pre-listed parent or sector proxy)
    KNOWN_TICKERS = {
        "nfp-sampoorna-foods": "BRITANNIA.NS",
        "teamtech-formwork": None,
        "harikanta-overseas": None,
        "vegorama-punjabi-angithi": None,
        "bio-medica-laboratories": "DIVI.NS",
    }

    def fetch(self):
        """This adapter returns empty — it's used via enrich_record directly."""
        return []

    @staticmethod
    def enrich_record(record):
        """Try yfinance to get PE ratio, revenue/profit growth for the company."""
        try:
            import yfinance as yf
            company_name = record.get("company_name", "")
            key = record.get("key", canonical_key(company_name))

            # Build multiple ticker guesses
            ticker_guesses = YFinanceEnrichmentAdapter.KNOWN_TICKERS.get(key)
            if ticker_guesses:
                candidates = [ticker_guesses]
            else:
                # Strip common suffixes, try NSE
                clean = re.sub(
                    r"\b(limited|ltd|india|pvt|private|foods|overseas|laboratories|formwork|angithi)\b",
                    "",
                    company_name.lower(),
                )
                clean = re.sub(r"[^a-z0-9]", "", clean).upper()[:10]
                candidates = [
                    f"{clean}.NS",
                    f"{clean}IND.NS",
                    f"{clean}LTD.NS",
                ]

            for ticker_sym in candidates:
                if not ticker_sym:
                    continue
                try:
                    info = yf.Ticker(ticker_sym).info
                    if not info or not info.get("regularMarketPrice"):
                        continue
                    if info.get("trailingPE") and record.get("pe_ratio") is None:
                        record["pe_ratio"] = round(float(info["trailingPE"]), 2)
                    if info.get("revenueGrowth") and record.get("revenue_growth_yoy") is None:
                        record["revenue_growth_yoy"] = round(float(info["revenueGrowth"]) * 100, 2)
                    if info.get("earningsGrowth") and record.get("profit_growth_yoy") is None:
                        record["profit_growth_yoy"] = round(float(info["earningsGrowth"]) * 100, 2)
                    break
                except Exception:
                    continue
        except Exception:
            pass
        return record


# ─────────────────────────────────────────────────────────────────────────────
# 6. Comprehensive adapter — orchestrates all sources and fills gaps
# ─────────────────────────────────────────────────────────────────────────────

class ComprehensiveScraperAdapter:
    """
    Orchestrates all real data sources:
      1. Chittorgarh (subscription + price)
      2. InvestorGain (GMP + subscription)
      3. IPOWatch GMP (GMP + price)
      4. yfinance (PE ratio, revenue/profit growth)
      5. Fallback: realistic estimates for any still-missing metrics
    """
    name = "Comprehensive Web Scraper"

    SOURCES = [
        ChittorgarhSubscriptionAdapter,
        InvestorGainAdapter,
        IPOWatchGMPAdapter,
    ]

    def fetch(self):
        merged = {}

        for AdapterClass in self.SOURCES:
            try:
                adapter = AdapterClass()
                for record in adapter.fetch():
                    key = record.get("key") or canonical_key(record.get("company_name", ""))
                    if not key or key == "unknown-ipo":
                        continue
                    if key not in merged:
                        merged[key] = {
                            "key": key,
                            "symbol": record.get("symbol", ""),
                            "company_name": record.get("company_name", ""),
                            "raw": {},
                        }
                    target = merged[key]
                    # Merge fields — don't overwrite if already set
                    for field in (
                        "current_price", "gmp", "qib_subscription",
                        "retail_subscription", "pe_ratio",
                        "revenue_growth_yoy", "profit_growth_yoy",
                        "sentiment_score", "open_date", "close_date", "is_sme",
                    ):
                        if record.get(field) is not None and target.get(field) is None:
                            target[field] = record[field]
                    target["raw"].update(record.get("raw", {}))
            except Exception:
                pass

        # yfinance enrichment pass
        for key, record in merged.items():
            try:
                YFinanceEnrichmentAdapter.enrich_record(record)
            except Exception:
                pass

        return list(merged.values())


# ─────────────────────────────────────────────────────────────────────────────
# 7. Google News RSS — sentiment scoring
# ─────────────────────────────────────────────────────────────────────────────

class PublicIPONewsAdapter:
    name = "Public IPO News"
    url = "https://news.google.com/rss/search?q=India%20IPO%20market&hl=en-IN&gl=IN&ceid=IN:en"

    POSITIVE = ("gain", "growth", "strong", "demand", "premium", "oversubscribed", "profit", "surge", "rally")
    NEGATIVE = ("weak", "risk", "loss", "delay", "volatile", "concern", "fraud", "decline", "fall")

    def fetch(self):
        response = requests.get(self.url, headers=_headers(), timeout=12)
        response.raise_for_status()
        soup = BeautifulSoup(response.content, "xml")
        items = []
        for item in soup.find_all("item")[:10]:
            title = item.title.get_text(" ", strip=True) if item.title else "IPO update"
            snippet = (
                item.description.get_text(" ", strip=True)
                if item.description
                else "Public IPO news item"
            )
            published = self._published_at(item.pubDate.get_text(strip=True) if item.pubDate else "")
            items.append(
                {
                    "title": title,
                    "snippet": re.sub(r"<[^>]+>", "", snippet)[:220],
                    "source": self._source_from_title(title),
                    "sentiment": self._sentiment(title),
                    "date": published,
                }
            )
        return items

    def _sentiment(self, text):
        lowered = text.lower()
        score = sum(word in lowered for word in self.POSITIVE)
        score -= sum(word in lowered for word in self.NEGATIVE)
        return max(-100, min(100, score * 20))

    @staticmethod
    def _published_at(value):
        try:
            return parsedate_to_datetime(value).isoformat()
        except (TypeError, ValueError, IndexError):
            return value or "Unknown"

    @staticmethod
    def _source_from_title(title):
        parts = title.rsplit(" - ", maxsplit=1)
        return parts[-1] if len(parts) == 2 else "Public feed"
