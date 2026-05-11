import os

import uvicorn


def main() -> None:
    host = os.getenv("SENTINEL_BACKEND_HOST", "127.0.0.1")
    port = int(os.getenv("SENTINEL_BACKEND_PORT", "8000"))
    reload_enabled = os.getenv("SENTINEL_BACKEND_RELOAD", "").lower() in {"1", "true", "yes"}

    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=reload_enabled,
        ws="websockets",
        log_level=os.getenv("SENTINEL_BACKEND_LOG_LEVEL", "info"),
    )


if __name__ == "__main__":
    main()
