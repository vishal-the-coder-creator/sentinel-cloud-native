import os

import generate_live_data


def main() -> None:
    api_host = os.getenv("SENTINEL_BACKEND_HOST", "127.0.0.1")
    api_port = os.getenv("SENTINEL_BACKEND_PORT", "8000")
    generate_live_data.API_URL = os.getenv(
        "SENTINEL_GENERATOR_API_URL",
        f"http://{api_host}:{api_port}/data",
    )
    generate_live_data.stream_live_data()


if __name__ == "__main__":
    main()
