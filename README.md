# IPO Management Demo


DB Schema : https://dbdiagram.io/d/Copy-of-Copy-of-DB-schema-6a1182e4b62396d22c520be4



This local project demonstrates the architecture-driven IPO workflow:

1. Public-source discovery checks exchange, GMP, and news adapters.
2. Normalization marks incomplete IPO metrics as `NEEDS_REVIEW`.
3. Reviewer metrics can complete an IPO before validation.
4. Accepted IPOs advance through simulated application, mandate, allotment, sell decision, and report states.

The local demo does not place broker orders, submit UPI mandates, or move funds.

## Run Locally

Start the backend in one terminal:

```powershell
cd "C:\Users\ADMIN\Downloads\IPO Trading Algo\backend"
..\.venv\Scripts\python.exe -m uvicorn main:app --reload --port 8000
```

Start the frontend in another terminal:

```powershell
cd "C:\Users\ADMIN\Downloads\IPO Trading Algo\frontend"
npm.cmd run dev
```

Open the Vite URL shown in the frontend terminal. The dashboard expects the API at `http://localhost:8000/api`; override it with `VITE_API_BASE_URL` if needed.

## Test

Run focused backend tests from the backend directory:

```powershell
..\.venv\Scripts\python.exe -m unittest discover -s tests -v
```

Run frontend checks from the frontend directory:

```powershell
npm.cmd run lint
npm.cmd run build
```
