# Sentinel Cloud Native Real Time Analytics Dashboard

Sentinel is a college-project-ready full stack dashboard that ingests live text messages, stores them in MongoDB, computes analytics in FastAPI, and renders live charts in a React + Vite frontend with WebSocket refresh.

## Stack

- Frontend: React 18, Vite 8, Chart.js, Zustand
- Backend: FastAPI, Motor/PyMongo, WebSocket broadcast manager
- Database: MongoDB in Docker
- Demo tooling: sample and live data generators

## Current Folder Structure

```text
finalProject/
|-- sentinel-backend/
`-- sentinel/
   `-- frontend/
```

## What Was Fixed

- Blank React screen caused by state-shape mismatches between initial frontend state and `/analytics` payload usage in chart and message components
- Added a React `ErrorBoundary` so the UI never fails to a blank screen
- Added resilient analytics fetch retry logic and visible retry actions
- Added safe empty-state handling when backend or MongoDB has no data
- Added WebSocket reconnect lifecycle handling and debug console logs
- Stabilized Vite server and preview ports and added backend proxy settings
- Tightened FastAPI CORS defaults to the frontend development and preview origins
- Added `.env.example` files and a repo-level `.gitignore`

## Production-Ready Frontend Structure

```text
sentinel/frontend/
|-- dist/
|-- src/
|   |-- components/
|   |   |-- ErrorBoundary.jsx
|   |   |-- ChartCard.jsx
|   |   |-- DashboardHeader.jsx
|   |   |-- KeywordChart.jsx
|   |   |-- MessageVolumeChart.jsx
|   |   |-- MessagesList.jsx
|   |   |-- SentimentChart.jsx
|   |   `-- StatsCards.jsx
|   |-- services/
|   |   |-- api.js
|   |   `-- websocket.js
|   |-- App.jsx
|   |-- main.jsx
|   |-- store.js
|   `-- styles.css
|-- .env.example
|-- package.json
`-- vite.config.js
```

## Local Setup

### Prerequisites

- Node.js 18.18+ or newer
- Python 3.10+
- Docker Desktop

### 1. Start MongoDB

```powershell
docker run -d --name sentinel-mongo -p 27017:27017 mongo:7
```

If the container already exists:

```powershell
docker start sentinel-mongo
```

### 2. Backend Setup

```powershell
cd C:\Users\r200362\OneDrive - HT Media Ltd\Documents\finalProject\sentinel-backend
py -m pip install -r requirements.txt
Copy-Item .env.example .env
py -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Backend verification URLs:

- Swagger UI: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- Health: [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health)

### 3. Frontend Setup

```powershell
cd C:\Users\r200362\OneDrive - HT Media Ltd\Documents\finalProject\sentinel\frontend
npm install
Copy-Item .env.example .env
npm run dev
```

Frontend URL:

- [http://127.0.0.1:3000](http://127.0.0.1:3000)

### 4. Stream Demo Data

```powershell
cd C:\Users\r200362\OneDrive - HT Media Ltd\Documents\finalProject\sentinel-backend
py generate_live_data.py
```

## API Contract

### `POST /data`

Stores a message in:

- Database: `sentinel_db`
- Collection: `messages`

Example payload:

```json
{
  "user": "demo-user",
  "message": "System warning detected in cloud analytics node"
}
```

### `GET /analytics`

Supported query params:

- `keyword`
- `hours`

Expected response fields:

- `total_messages`
- `keyword_counts`
- `sentiment_totals`
- `time_series`
- `latest_messages`

### `ws://localhost:8000/ws`

- Backend broadcasts after successful `POST /data`
- Frontend listens and re-fetches analytics in the background

## Demo Validation Checklist

1. Open `/docs` and confirm backend is up.
2. Open the frontend and confirm the dashboard renders even before any data exists.
3. Trigger `generate_live_data.py`.
4. Confirm cards populate.
5. Confirm message volume, keyword trend, and sentiment charts update.
6. Confirm latest messages list refreshes.
7. Try disconnecting the backend and confirm the frontend shows retry and warning states instead of going blank.

## Production Build

Run from [package.json](C:/Users/r200362/OneDrive%20-%20HT%20Media%20Ltd/Documents/finalProject/sentinel/frontend/package.json):

```powershell
cd C:\Users\r200362\OneDrive - HT Media Ltd\Documents\finalProject\sentinel\frontend
npm run build
```

Build output:

- [dist](C:/Users/r200362/OneDrive%20-%20HT%20Media%20Ltd/Documents/finalProject/sentinel/frontend/dist)

Preview the production build locally:

```powershell
npm run preview
```

## Deployment Notes

### Frontend

- Deploy the `dist` folder to Netlify, Vercel, GitHub Pages, or an Nginx static host
- Set:
  - `VITE_GATEWAY_HTTP_URL`
  - `VITE_GATEWAY_WS_URL`

### Backend

- Deploy FastAPI behind Uvicorn or Gunicorn/Uvicorn workers
- Set:
  - `MONGODB_URI`
  - `MONGODB_DB_NAME=sentinel_db`
  - `CORS_ALLOWED_ORIGINS`

## Windows Executable Packaging

Electron is the simplest demo-friendly option for a pendrive or offline faculty demo.

### Recommended Approach

1. Build the frontend with `npm run build`.
2. Create a lightweight Electron wrapper that loads the built `dist/index.html`.
3. Package the Electron app with `electron-builder`.
4. Bundle the backend as a separate local service or run it via a packaged Python executable.

### Suggested Electron Files

Create these inside a new `sentinel-desktop/` folder:

- `package.json`
- `main.js`
- `preload.js`

### Suggested Electron Dependencies

```powershell
npm install electron
npm install -D electron-builder
```

### Minimal `main.js`

```js
const { app, BrowserWindow } = require("electron");
const path = require("path");

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    autoHideMenuBar: true,
  });

  win.loadFile(path.join(__dirname, "../sentinel/frontend/dist/index.html"));
}

app.whenReady().then(createWindow);
```

### Build Windows `.exe`

```powershell
npx electron-builder --win portable
```

This produces:

- A portable `.exe` suitable for running from a pendrive
- A packaged Windows app for demo distribution

## Portable Pendrive Demo Plan

For the most reliable portable demo:

1. Keep MongoDB and backend on the demo laptop.
2. Carry the packaged Electron frontend `.exe`.
3. Also carry a `start-demo.bat` that starts:
   - Docker MongoDB
   - FastAPI backend
   - optional live data generator
4. Keep a fallback dataset already inserted in MongoDB before the presentation.

Example `start-demo.bat` flow:

```bat
docker start sentinel-mongo
cd /d C:\path\to\sentinel-backend
start py -m uvicorn main:app --host 0.0.0.0 --port 8000
timeout /t 4 > nul
start py generate_live_data.py
start Sentinel.exe
```

## GitHub Release Checklist

1. Keep `.env` files out of the repo and commit only `.env.example`.
2. Commit the root `.gitignore`.
3. Add screenshots or a short GIF in the release notes.
4. Include:
   - setup steps
   - build steps
   - API contract
   - demo steps
   - known limitations
5. Attach:
   - source zip
   - frontend production build if needed
   - Electron portable `.exe`

## Known Limitations

- This workspace could not directly inspect browser console logs because the in-app browser plugin requires a newer Node runtime than the one available here.
- Backend runtime verification from this thread was not possible because `127.0.0.1:8000` was not reachable in this session at the time of testing.
- The frontend build was verified successfully with `npm run build`.

## Quick Troubleshooting

### Frontend still appears blank

- Check the browser console for a failed custom local change
- Confirm `src/main.jsx` mounts into `#root`
- Confirm `npm install` completed successfully
- Re-run `npm run build`

### Charts stay empty

- Confirm `GET /analytics` returns data
- Confirm `generate_live_data.py` is running
- Confirm MongoDB contains recent messages

### WebSocket not updating

- Confirm `ws://127.0.0.1:8000/ws` is reachable
- Watch the dashboard status card for reconnecting state
- Trigger a `POST /data` call and confirm the backend broadcasts updates
