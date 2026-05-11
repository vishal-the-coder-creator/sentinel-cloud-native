# Sentinel Desktop Packaging Guide

This folder turns the existing Sentinel project into a Windows desktop demo application with:

- Electron desktop shell
- packaged React frontend
- packaged FastAPI backend
- optional packaged live data generator
- automatic MongoDB startup strategy for local MongoDB or Docker
- `portable .exe` and installer `.exe` outputs via `electron-builder`

## Expected Project Layout

```text
finalProject/
|-- sentinel/
|   |-- frontend/
|   |-- services/
|   `-- docker-compose.yml
|-- sentinel-backend/
|   |-- main.py
|   |-- run_backend.py
|   `-- run_live_generator.py
`-- sentinel-desktop/
    |-- app/
    |   |-- backend-dist/
    |   `-- frontend-dist/
    |-- build/
    |   `-- backend/
    |-- config/
    |   `-- demo.env.example
    |-- docker/
    |   `-- docker-compose.mongo.yml
    |-- scripts/
    |   |-- build-backend.bat
    |   |-- build-generator.bat
    |   |-- prepare-build.mjs
    |   |-- start-backend.bat
    |   `-- start-generator.bat
    |-- build-all.bat
    |-- main.js
    |-- package.json
    |-- preload.js
    `-- start-demo.bat
```

## What The Desktop App Starts Automatically

When the Electron app launches, `main.js` follows this order:

1. Check whether MongoDB is already reachable on `127.0.0.1:27017`.
2. If not, try to start local `mongod.exe`.
3. If local MongoDB is not installed, try Docker container `mongo:7`.
4. Start the FastAPI backend on `127.0.0.1:8000`.
5. Optionally start the live message generator.
6. Open the packaged frontend inside Electron.

## Frontend Packaging

The Electron window loads the production frontend build from:

```text
sentinel-desktop/app/frontend-dist/index.html
```

The preload bridge injects runtime desktop config:

- `window.sentinelDesktop.apiBase`
- `window.sentinelDesktop.wsBase`

This keeps the React app working from `file://` without needing a Vite dev server.

## Backend Packaging

The FastAPI backend is packaged from:

- `sentinel-backend/run_backend.py`
- `sentinel-backend/run_live_generator.py`

The packaged output names are:

- `SentinelBackend.exe`
- `LiveDataGenerator.exe`

These are copied into:

```text
sentinel-desktop/build/backend/
sentinel-desktop/app/backend-dist/
```

## Terminal Commands

Run these from `sentinel-desktop` unless noted otherwise.

### 1. Install desktop dependencies

```powershell
npm install
```

### 2. Build the React frontend

```powershell
cd ..\sentinel\frontend
npm install
npm run build
cd ..\..\sentinel-desktop
```

### 3. Install Python dependencies for backend packaging

```powershell
cd ..\sentinel-backend
py -m pip install -r requirements.txt
py -m pip install pyinstaller
cd ..\sentinel-desktop
```

### 4. Build standalone backend executable

```powershell
scripts\build-backend.bat
```

### 5. Build standalone live generator executable

```powershell
scripts\build-generator.bat
```

### 6. Copy assets into Electron project

```powershell
npm run prepare:assets
```

### 7. Build portable and installer executables

```powershell
npx electron-builder --win portable nsis
```

### 8. Use one command for everything

```powershell
build-all.bat
```

## Run Source Demo Mode

This starts the Electron shell from source and uses Python scripts directly for backend startup:

```powershell
start-demo.bat
```

## Electron Features Enabled

- hidden menu bar
- maximized fullscreen-friendly window
- backend + Mongo startup automation
- offline local frontend bundle
- preload bridge with runtime API config
- portable execution flow for college demo use

## Environment Variables

Copy `config/demo.env.example` into your own environment setup if needed.

Important variables:

- `SENTINEL_BACKEND_HOST`
- `SENTINEL_BACKEND_PORT`
- `SENTINEL_AUTO_START_GENERATOR`
- `MONGODB_URI`
- `MONGODB_DB_NAME`
- `CORS_ALLOWED_ORIGINS`

## Portable Pendrive Demo Checklist

For the safest faculty demo flow:

1. Build the app on your own machine first.
2. Test `Sentinel-Analytics-Portable-*.exe` on a second Windows machine.
3. If you plan to rely on Docker MongoDB, pre-pull `mongo:7` before going offline.
4. If you plan to rely on local MongoDB, confirm `mongod.exe` exists on the demo machine.
5. Keep the portable exe and the generated `release/` folder on the pendrive.
6. Keep one fallback machine with local MongoDB already installed.

## Packaging Notes

`electron-builder` generates:

- portable executable
- NSIS installer executable

Outputs are written to:

```text
sentinel-desktop/release/
```

## Troubleshooting

### Frontend opens but analytics does not load

- Confirm backend health:

```powershell
Invoke-WebRequest http://127.0.0.1:8000/health
```

- Confirm analytics endpoint:

```powershell
Invoke-WebRequest http://127.0.0.1:8000/analytics
```

### Electron starts but backend executable is missing

- Re-run:

```powershell
scripts\build-backend.bat
scripts\build-generator.bat
npm run prepare:assets
```

### MongoDB does not start

- Install local MongoDB Server and make sure `mongod.exe` is available.
- Or pre-pull Docker image:

```powershell
docker pull mongo:7
```

- Or manually run:

```powershell
docker compose -f docker\docker-compose.mongo.yml up -d
```

### Portable exe works on your laptop but not on faculty system

- Check Microsoft Visual C++ runtime availability.
- Check Windows Defender or SmartScreen prompts.
- Run once as administrator if the environment blocks child processes.
- Verify Docker Desktop or MongoDB Server is installed if your demo depends on them.

### WebSocket does not connect

- Confirm backend is on `127.0.0.1:8000`.
- Confirm `/ws` is reachable.
- Confirm no other service is already occupying port `8000`.

## Recommended Demo Flow

1. Run `build-all.bat`.
2. Copy the `release` output to a pendrive.
3. On the demo machine, launch the portable exe.
4. Wait for MongoDB, backend, and generator startup.
5. Show the live dashboard with offline local data generation.
