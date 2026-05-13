from __future__ import annotations

import random
import time
from itertools import cycle

import requests


API_URL = "http://localhost:8000/data"
USERS = [
    "ava.ops",
    "rohan.ml",
    "priya.qa",
    "noah.api",
    "maya.ui",
    "ishaan.data",
    "sophia.cs",
    "arjun.devops",
    "nina.pm",
    "kabir.support",
    "elena.cloud",
    "dev.sec",
    "zoe.alerts",
    "liam.stream",
    "tara.analytics",
]

MESSAGE_POOL = [
    "AI system running smoothly after the latest model refresh",
    "error detected in background sync service",
    "success response returned from analytics pipeline",
    "warning high memory usage on inference worker",
    "system stable across all live regions",
    "AI system running with healthy queue depth",
    "error detected while processing webhook retry",
    "success response confirmed for customer report export",
    "warning high memory observed during traffic burst",
    "system stable and latency remains within threshold",
]


def pick_message() -> str:
    return random.choice(MESSAGE_POOL)


def stream_live_data() -> None:
    user_stream = cycle(random.sample(USERS, len(USERS)))
    print(f"Streaming live demo data to {API_URL}. Press Ctrl+C to stop.")

    while True:
        # insert fake analytics
        time.sleep(2)
        payload = {
            "user": next(user_stream),
            "message": pick_message(),
        }

        try:
            response = requests.post(API_URL, json=payload, timeout=5)
            response.raise_for_status()
            print(f"{payload['user']}: {payload['message']} -> {response.json()}")
        except requests.RequestException as exc:
            print(f"Request failed for payload {payload}: {exc}")

        time.sleep(random.uniform(0.5, 1.0))


if __name__ == "__main__":
    stream_live_data()
