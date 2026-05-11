from __future__ import annotations

import argparse
import json
import random
import sys
import time
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Any
from urllib import error, request


DEFAULT_API_URL = "http://localhost:8000/data"


@dataclass(frozen=True)
class SampleMessage:
    user: str
    message: str
    timestamp: str
    sentiment: str


def build_sample_messages() -> list[SampleMessage]:
    users = [
        "Ava",
        "Rohan",
        "Priya",
        "Noah",
        "Maya",
        "Ishaan",
        "Sophia",
        "Arjun",
        "Nina",
        "Kabir",
        "Elena",
        "Dev",
    ]
    message_templates: list[tuple[str, str]] = [
        ("positive", "The new ai assistant rollout was a success and the support team closed every ticket ahead of schedule."),
        ("negative", "We hit an error in the billing sync and the overnight import may fail again if the patch is not deployed."),
        ("neutral", "The warning from the monitoring bot appeared after the ai job completed, but nothing critical changed."),
        ("positive", "Customer onboarding was a success today because the ai summary tool helped agents respond faster."),
        ("negative", "A fail state appeared in the export service and the team is still tracing the root error."),
        ("neutral", "There was a warning during staging deployment, although the release notes look normal so far."),
        ("positive", "The recommendation engine used ai to improve relevance and early feedback from sales was a success."),
        ("negative", "We saw another error when the report generator tried to attach images, and one request did fail."),
        ("neutral", "The ai digest finished on time and the warning count stayed close to yesterday's average."),
        ("positive", "After the hotfix, the login flow was a success and no user reported a fail message."),
        ("negative", "The alert channel lit up after an api error, and one downstream webhook did fail twice."),
        ("neutral", "A warning was logged for cache warmup, but the ai pipeline remained steady throughout the hour."),
        ("positive", "Search relevance looks stronger now and the ai ranking update was a measurable success."),
        ("negative", "The checkout page returned an error for a few users, so the retry logic may fail under load."),
        ("neutral", "Operations noted a warning on disk usage while the ai indexing task continued as expected."),
        ("positive", "Our internal beta went well, and the ai copilot generated a success story for the product demo."),
        ("negative", "The nightly batch may fail if this database error keeps blocking writes from the worker."),
        ("neutral", "The warning banner cleared automatically after the ai classifier refreshed its configuration."),
        ("positive", "Support marked the migration a success because every ai-generated answer passed review."),
        ("negative", "An error during session cleanup caused one background task to fail after midnight."),
        ("neutral", "The qa team recorded a warning about formatting, but the ai transcript itself looked fine."),
        ("positive", "The new dashboard release was a success and even the warning volume dropped this morning."),
        ("negative", "We still see an error in the event stream, and the replay could fail without extra retries."),
        ("neutral", "A single warning came from the scheduler, yet the ai inference queue stayed mostly idle."),
        ("positive", "The recovery drill was a success because the ai notifier surfaced every issue in seconds."),
        ("negative", "The payment callback threw an error and one reconciliation step did fail before completion."),
        ("neutral", "Product asked about the ai feature usage, and only a routine warning showed up in logs."),
        ("positive", "Yesterday's campaign was a success, and the ai-generated tags helped increase engagement."),
        ("negative", "There is a risk the sync will fail tonight because the storage error has not been resolved."),
        ("neutral", "The warning threshold was adjusted while the ai worker continued processing as normal."),
    ]

    base_time = datetime.now(timezone.utc) - timedelta(minutes=len(message_templates) * 3)
    samples: list[SampleMessage] = []

    for index, (sentiment, template) in enumerate(message_templates):
        timestamp = (base_time + timedelta(minutes=index * 3)).isoformat()
        samples.append(
            SampleMessage(
                user=users[index % len(users)],
                message=template,
                timestamp=timestamp,
                sentiment=sentiment,
            )
        )

    return samples


def post_message(api_url: str, sample: SampleMessage, timeout: float) -> dict[str, Any]:
    payload = {
        "user": sample.user,
        "message": sample.message,
        "timestamp": sample.timestamp,
    }
    body = json.dumps(payload).encode("utf-8")
    req = request.Request(
        api_url,
        data=body,
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    with request.urlopen(req, timeout=timeout) as response:
        response_body = response.read().decode("utf-8")
        return json.loads(response_body) if response_body else {}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Send realistic sample messages to the real-time analytics API.",
    )
    parser.add_argument(
        "--api-url",
        default=DEFAULT_API_URL,
        help=f"Target POST endpoint. Default: {DEFAULT_API_URL}",
    )
    parser.add_argument(
        "--delay",
        type=float,
        default=0.75,
        help="Delay in seconds between requests. Default: 0.75",
    )
    parser.add_argument(
        "--jitter",
        type=float,
        default=0.35,
        help="Maximum random jitter added to each delay. Default: 0.35",
    )
    parser.add_argument(
        "--timeout",
        type=float,
        default=8.0,
        help="HTTP timeout in seconds. Default: 8.0",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    samples = build_sample_messages()

    print(f"Sending {len(samples)} sample messages to {args.api_url}")

    for index, sample in enumerate(samples, start=1):
        try:
            response = post_message(args.api_url, sample, args.timeout)
            print(
                f"[{index:02d}/{len(samples)}] "
                f"{sample.timestamp} | {sample.user:<6} | {sample.sentiment:<8} | "
                f"{sample.message}"
            )
            if response:
                print(f"  API response: {response}")
        except error.HTTPError as exc:
            details = exc.read().decode("utf-8", errors="replace")
            print(f"HTTP {exc.code} while sending sample {index}: {details}", file=sys.stderr)
            return 1
        except error.URLError as exc:
            print(f"Connection error while sending sample {index}: {exc}", file=sys.stderr)
            return 1

        if index != len(samples):
            pause = max(0.0, args.delay + random.uniform(0, args.jitter))
            time.sleep(pause)

    print("Sample message stream completed successfully.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
