# Sentinel Real-Time Analytics Engine

This folder is the main Sentinel application workspace.

## Services

- `services/ingestion-service`: FastAPI ingestion API with `POST /data`
- `services/processing-service`: Kafka consumer for sentiment and keyword enrichment
- `services/analytics-service`: analytics persistence, caching, and alert generation
- `services/api-gateway`: REST and WebSocket gateway for the UI
- `frontend`: only frontend source of truth for the project

## Topics

- `raw-messages`
- `processed-messages`
- `alerts`

## Collections

- `messages`
- `analytics`
- `sentiment_summary`

## Run

```powershell
docker compose up --build
```

Open `http://localhost:3000` after the containers start.

## Notes

- The API gateway exposes `GET /analytics`, `GET /sentiment`, and `ws://localhost:8000/ws`.
- The processing service defaults to `TextBlob`, with optional Transformers support via `SENTIMENT_PROVIDER=transformers`.
- Alert events are emitted when the configured spike threshold is exceeded for the configured alert keyword.
