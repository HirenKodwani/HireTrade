
## Prediction System for the Analysis of Indian IPO Market
**with Automated Execution Using Machine Learning**  




## TABLE OF CONTENTS
1. [Introduction](#1-introduction)
2. [System Requirements](#2-system-requirements)
3. [Installation Guide](#3-installation-guide)
4. [Configuration Guide](#4-configuration-guide)
5. [User Interface Guide](#5-user-interface-guide)
6. [File Reference](#6-file-reference)
7. [API Reference](#7-api-reference)
8. [Troubleshooting Guide](#8-troubleshooting-guide)
9. [Deployment Guide](#9-deployment-guide)
10. [Future Enhancements](#10-future-enhancements)
11. [Appendix](#11-appendix)

---

## 1. Introduction

### 1.1 What is IPOPilot AI?
IPOPilot AI is a next-generation, AI-powered Initial Public Offering (IPO) Intelligence and Application Platform. Designed for retail investors, institutional traders, and market analysts, the platform streamlines the entire IPO lifecycle—from discovery and analysis to execution and portfolio tracking. By leveraging advanced web scraping, predictive AI models, and seamless broker API integrations, IPOPilot AI removes the guesswork from IPO investing and provides data-driven, actionable insights.

### 1.2 Key Features
- **AI-Powered Recommendations:** Analyzes grey market premiums (GMP), subscription rates, and financial metrics to generate "Apply," "Avoid," or "Watch" signals.
- **Real-Time Data Aggregation:** Aggregates live IPO data from multiple authoritative financial sources using resilient web scraping adapters.
- **IPO Copilot:** An interactive, conversational AI assistant capable of answering complex financial questions and summarizing IPO prospects.
- **Automated Lifecycle Management:** Tracks IPOs from the "Discovered" phase through "Open," "Allotment," and "Listed" phases.
- **Broker Integration:** Seamlessly connects with broker APIs (e.g., Angel One Smart API) to retrieve portfolio holdings and execute smart orders.
- **Comprehensive Dashboards:** Provides visual analytics for GMP tracking, subscription tracking, and overall AI performance accuracy.

### 1.3 Technology Stack
The platform is built on a modern, robust, and scalable technology stack:
- **Frontend:** React, Vite, Tailwind CSS, Shadcn UI, Recharts, Framer Motion
- **Backend:** Python, FastAPI, SQLAlchemy
- **Database:** SQLite (Development) / PostgreSQL (Production ready)
- **Integrations:** Angel One Smart API, Google GenAI (Gemini), Custom Web Scrapers (curl_cffi, BeautifulSoup)

---

## 2. System Requirements

### 2.1 Hardware Requirements
- **Processor:** Dual-core 2.0 GHz or higher (Quad-core recommended)
- **RAM:** 4 GB minimum (8 GB recommended for development and concurrent background tasks)
- **Storage:** 2 GB of free disk space for application files and database growth.

### 2.2 Software Requirements
- **Operating System:** Windows 10/11, macOS 10.15+, or modern Linux distributions (Ubuntu 20.04+).
- **Runtime Environments:**
  - Node.js (v18.x or higher)
  - npm (v9.x or higher) or yarn
  - Python (v3.10 or higher)
- **Web Browser:** Google Chrome, Mozilla Firefox, Safari, or Microsoft Edge (latest versions recommended for optimal UI performance).

### 2.3 Internet Requirements
- A stable broadband internet connection is required for real-time web scraping, AI API communication, and broker API synchronization.

---

## 3. Installation Guide

### 3.1 Local Setup
Clone the repository to your local machine using Git:
```bash
git clone https://github.com/your-org/ipo-pilot-ai.git
cd ipo-pilot-ai
```

### 3.2 Frontend Setup
Navigate to the frontend directory, install dependencies, and prepare the environment:
```bash
cd frontend
npm install
```
This will install all necessary React dependencies, Tailwind CSS utilities, and charting libraries.

### 3.3 Backend Setup
Navigate to the backend directory and set up a Python virtual environment:
```bash
cd ../backend
python -m venv .venv

# On Windows:
.venv\Scripts\activate
# On macOS/Linux:
source .venv/bin/activate

pip install -r requirements.txt
```

### 3.4 Environment Variables
Create a `.env` file in the `backend` directory with the following required variables:
```env
# AI Integration
GEMINI_API_KEY=your_google_gemini_api_key

# Broker Integration
ANGEL_ONE_API_KEY=your_angel_one_smart_api_key
ANGEL_ONE_CLIENT_ID=your_client_id
ANGEL_ONE_PIN=your_pin
ANGEL_ONE_TOTP_SECRET=your_totp_secret

# Application Config
CORS_ORIGINS=http://localhost:5173
DATABASE_URL=sqlite:///./ipo_trading.db
```

### 3.5 Running the Application
**Start the Backend Server:**
Ensure your virtual environment is active, then run:
```bash
cd backend
python main.py
```
*The backend runs on `http://localhost:8000`.*

**Start the Frontend Server:**
Open a new terminal window:
```bash
cd frontend
npm run dev
```
*The frontend runs on `http://localhost:5173`.*

---

## 4. Configuration Guide

### 4.1 Angel One Smart API Configuration
To enable live portfolio synchronization and smart ordering, the application requires an active Angel One Smart API developer account.
1. Generate an API Key from the Angel One Developer portal.
2. Ensure your TOTP secret is configured correctly to bypass manual 2FA prompts during automated background syncs.
3. Update the `.env` file with these credentials. The backend service will handle JWT token generation and session renewal automatically.

### 4.2 IPO Decision Metrics Configuration
The Validation Engine uses customizable thresholds to determine whether an IPO is an "Apply" or "Avoid."
- **Minimum GMP Threshold:** Set the minimum acceptable Grey Market Premium (e.g., 15%).
- **Minimum QIB Subscription:** Set the minimum Qualified Institutional Buyer subscription rate (e.g., 2.0x).
- These configurations can be adjusted dynamically in the **Settings** page of the frontend.

### 4.3 AI Recommendation Settings
The platform integrates with Google GenAI. You can configure the model strictness and prompt behavior via the Settings page. Choose between aggressive, moderate, and conservative risk profiles, which influences the AI's final decision scoring.

### 4.4 Notification Settings
Configure WebSocket or email alerts to notify users when a new IPO enters the "Ready to Apply" phase, or when an allotment status is updated.

### 4.5 Portfolio Configuration
Users can input manual holdings or rely entirely on broker API synchronization. The portfolio configuration allows mapping internal IPO symbols to broker-specific trading symbols.

---

## 5. User Interface Guide

### 5.1 Home Page
- **Purpose:** Provides a high-level overview of the IPO market and system health.
- **Main Components:** Market summary cards, quick navigation links, recent AI recommendations, and system status indicators.
- **Workflow:** Users log in and land on this page to quickly gauge market sentiment and see if any urgent IPO actions are required.
- **Expected Results:** A responsive, visually engaging dashboard with real-time aggregated metrics.

### 5.2 Live IPO Dashboard
- **Purpose:** Displays IPOs that are currently open for subscription.
- **Main Components:** Data table with sortable columns (Price Band, GMP, QIB Sub, AI Signal).
- **Workflow:** Users navigate here to view actionable IPOs. They can click "Run Discovery" to force a live web scrape.
- **User Actions:** Click on any row to navigate to the detailed view. Click "Run Discovery" to fetch latest metrics.
- **Expected Results:** Table updates dynamically. High-conviction IPOs are highlighted with a "success" badge.

### 5.3 IPO Details Page
- **Purpose:** Deep dive into a specific IPO's financials, dates, and AI rationale.
- **Main Components:** Fundamental metric cards, AI Decision Rationale breakdown, Subscription progress bars, and Smart Order execution buttons.
- **Workflow:** Review the AI's confidence score and detailed reasoning before deciding to apply.
- **User Actions:** Click "Apply Now" to route the order through the Smart API.

### 5.4 AI Recommendation Panel
- **Purpose:** Centralized view of all AI-generated investment signals.
- **Main Components:** List of IPOs categorized by "Apply", "Watch", and "Avoid".
- **Expected Results:** Helps users bypass manual data analysis by presenting clear, justifiable recommendations.

### 5.5 IPO Copilot
- **Purpose:** An interactive chat interface powered by LLMs to answer specific IPO-related queries.
- **Main Components:** Chat window, suggested prompt chips, and a dynamic context engine.
- **Workflow:** The user asks a question (e.g., "Why did Susan Electricals get rejected?"). The Copilot retrieves the database record and explains the AI's reasoning.

### 5.6 GMP Tracker
- **Purpose:** Dedicated tracking for the Grey Market Premium.
- **Main Components:** Sortable table detailing the issue price, GMP, and estimated listing gain.
- **Workflow:** The user views the highest performing IPOs in the grey market.

### 5.7 Subscription Tracker
- **Purpose:** Monitors QIB, NII, and Retail subscription rates.
- **Main Components:** Progress bars mapping out subscription tiers.
- **Expected Results:** Quick visualization of retail and institutional interest.

### 5.8 Allotment Center
- **Purpose:** Tracks the post-application status of IPOs.
- **Main Components:** Status timeline, PAN number input for manual checks, and automated broker sync status.

### 5.9 Portfolio Dashboard
- **Purpose:** Displays the user's current holdings, total invested amount, and current valuation.
- **Main Components:** Donut charts for asset allocation, line charts for P&L tracking, and a table of current holdings fetched from the broker API.

### 5.10 Settings Page
- **Purpose:** Manages application preferences and API keys.
- **Main Components:** Forms for updating API keys, toggles for auto-discovery, and risk profile selectors.

---

## 6. File Reference

### 6.1 Frontend Structure
```text
frontend/
├── src/
│   ├── api/                 # Axios configurations and API wrappers
│   ├── components/          # Reusable UI components (buttons, cards, layout)
│   ├── pages/               # Main page views (Dashboard, Portfolio, AIHub)
│   ├── App.jsx              # Main React router configuration
│   └── index.css            # Tailwind global styles
```

### 6.2 Backend Structure
```text
backend/
├── main.py                  # FastAPI application entry point
├── database.py              # SQLAlchemy models and connection setup
├── data_aggregator.py       # Orchestrates web scraping and data merging
├── source_adapters.py       # Implementations of specific web scrapers (IPO Watch, etc.)
├── validation_engine.py     # AI evaluation and threshold checking logic
└── scripts/                 # Utility scripts (seed_from_ipowatch.py)
```

### 6.3 Database Models
- **IPORecord:** Stores core IPO details (Symbol, Price, GMP, Subscriptions, AI Score, Decision).
- **DecisionConfig:** Stores dynamic thresholds for validation.
- **UserPortfolio:** Stores synced holdings and simulated P&L.

### 6.4 Services
- **Validation Engine:** Evaluates metrics against thresholds and calls the Google GenAI API to generate a final decision and rationale.
- **Discovery Engine:** Manages background tasks that run `source_adapters.py` to fetch live data.

### 6.5 API Integrations
- **Source Adapters:** Uses `curl_cffi` to bypass anti-bot protections and scrape HTML tables from public IPO data providers.
- **GenAI Adapter:** Uses the official `google-genai` Python SDK to generate structured JSON analysis.

---

## 7. API Reference

### 7.1 IPO APIs
| Endpoint | Method | Purpose | Input Parameters | Expected Usage |
|----------|--------|---------|------------------|----------------|
| `/api/ipos` | GET | Retrieve all IPOs | None | Fetching dashboard data. |
| `/api/ipos/{id}` | GET | Retrieve specific IPO | `id` (int) | View detailed IPO metrics. |

**Sample Response:**
```json
{
  "id": 8,
  "symbol": "SUSAN_ELEC",
  "company_name": "Susan Electricals",
  "current_price": 127.0,
  "gmp": 64.0,
  "decision": "ACCEPTED",
  "confidence": 100.0
}
```

### 7.2 FastAPI Endpoints
| Endpoint | Method | Purpose | Input Parameters | Expected Usage |
|----------|--------|---------|------------------|----------------|
| `/api/discovery/run` | POST | Trigger live web scrape | None | User clicks "Run Discovery". |
| `/api/analytics` | GET | Fetch AI performance | None | Render AI Performance page. |

### 7.3 Angel One Smart API
| Endpoint | Method | Purpose | Input Parameters | Expected Usage |
|----------|--------|---------|------------------|----------------|
| `/api/portfolio/sync` | POST | Sync holdings from Angel One | None | Sync current portfolio values. |

### 7.4 AI Copilot API
| Endpoint | Method | Purpose | Input Parameters | Expected Usage |
|----------|--------|---------|------------------|----------------|
| `/api/copilot/chat` | POST | Send message to AI | `{"message": "string"}` | Chatbot interactions. |

---

## 8. Troubleshooting Guide

### 8.1 Application Not Starting
**Issue:** Running `python main.py` throws a `ModuleNotFoundError`.
**Resolution:** Ensure your virtual environment is activated and you have run `pip install -r requirements.txt`.

### 8.2 Backend Connection Errors
**Issue:** Frontend shows "Network Error".
**Resolution:** Verify that `main.py` is running on port 8000. Ensure `CORS_ORIGINS` in `.env` includes `http://localhost:5173`.

### 8.3 IPO Data Not Loading
**Issue:** Dashboard shows no IPOs.
**Resolution:** Run the database seed script: `python backend/scripts/seed_from_ipowatch.py`.

### 8.4 Smart API Authentication Failure
**Issue:** Portfolio page shows "Failed to sync."
**Resolution:** Verify your `ANGEL_ONE_API_KEY` and `ANGEL_ONE_TOTP_SECRET` in the `.env` file. Ensure your developer account is active.

### 8.5 Dashboard Rendering Issues
**Issue:** UI looks unstyled or broken.
**Resolution:** Ensure Tailwind CSS is building correctly. Run `npm run dev` and check for syntax errors in your JSX files.

### 8.6 AI Copilot Not Responding
**Issue:** Chatbot returns a 500 Internal Server Error.
**Resolution:** Verify your `GEMINI_API_KEY` is valid. Check backend logs for rate-limiting errors from Google.

### 8.7 Portfolio Sync Issues
**Issue:** API key valid, but holdings are empty.
**Resolution:** The market may be closed, or the API requires re-authentication. Navigate to settings and trigger a manual re-auth.

---

## 9. Deployment Guide

### 9.1 Local Deployment
For local testing, utilize the Vite dev server for the frontend and Uvicorn for the FastAPI backend as described in the Installation section.

### 9.2 Render Deployment
1. Connect your GitHub repository to Render.
2. **Backend Web Service:** Create a new Web Service. Set the Build Command to `pip install -r requirements.txt` and Start Command to `uvicorn main:app --host 0.0.0.0 --port $PORT`.
3. **Frontend Static Site:** Create a Static Site. Set Build Command to `npm install && npm run build` and Publish Directory to `dist`.

### 9.3 Docker Deployment
Create a `docker-compose.yml` file to orchestrate the frontend and backend containers.
```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    ports: ["8000:8000"]
    env_file: .env
  frontend:
    build: ./frontend
    ports: ["80:80"]
```
Run `docker-compose up --build` to deploy the stack securely.

### 9.4 Production Deployment
- **Environment Variables:** Never commit `.env` files. Use secure secret managers.
- **Database:** Migrate from SQLite to PostgreSQL for concurrent read/write capabilities.
- **Cron Jobs:** Set up dedicated CRON jobs for `run_discovery` rather than relying on user-triggered requests.

---

## 10. Future Enhancements
- **Multi-Broker Support:** Expand beyond Angel One to support Zerodha, Upstox, and Groww API bindings.
- **Advanced Machine Learning:** Implement predictive models using historical listing gains to forecast expected returns with higher precision.
- **Mobile Application:** Port the React application to React Native for iOS and Android deployment.
- **Algorithmic Bidding:** Automate the entire bidding process based on precise micro-second timing on the final day of subscription.

---

## 11. Appendix
- **Glossary:**
  - **GMP:** Grey Market Premium. The premium at which IPO shares are traded in the unofficial market prior to listing.
  - **QIB:** Qualified Institutional Buyer.
  - **NII:** Non-Institutional Investor.
  - **Retail:** Individual investors bidding for less than ₹2,00,000.
- **References:**
  - [FastAPI Documentation](https://fastapi.tiangolo.com/)
  - [React Documentation](https://react.dev/)
  - [Google Gemini API Docs](https://ai.google.dev/)

---
*© 2026 IPOPilot AI Development Team. All Rights Reserved.*
