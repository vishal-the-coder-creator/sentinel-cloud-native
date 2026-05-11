import requests
import time
import random

url = "http://localhost:8000/data"

messages = [
    "AI success achieved",
    "error occurred in system",
    "warning memory high",
    "AI model working great",
    "system failure detected",
    "success rate improved",
    "critical error handled",
    "AI performance boosted",
    "warning resolved",
    "system stable now"
]

for i in range(30):
    requests.post(url, json={
        "user": f"user{i}",
        "message": random.choice(messages)
    })
    time.sleep(0.3)