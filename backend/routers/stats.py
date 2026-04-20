"""
SadakSathi — In-Memory Stats Router

Maintains running detection totals for the current server session.
Detection routers call `record_detection()` after each successful inference.

Endpoints:
    GET  /stats          — return aggregate counters
    POST /stats/reset    — reset all counters (admin use)
"""

from __future__ import annotations

import threading
from collections import defaultdict

from fastapi import APIRouter

router = APIRouter(prefix="/stats", tags=["Stats"])

# ── Thread-safe in-memory store ──────────────────────────────────────────────
_lock = threading.Lock()

_counters: dict = {
    "total_uploads": 0,
    "road_uploads": 0,
    "traffic_uploads": 0,
    "total_detections": 0,
    "high_priority_count": 0,
    "medium_priority_count": 0,
    "low_priority_count": 0,
    "class_counts": defaultdict(int),
}


def record_detection(
    *,
    engine: str,                  # "road" | "traffic"
    total_detections: int,
    priority_counts: dict,        # {"High": n, "Medium": n, "Low": n}
    class_counts: dict,           # {"pothole": n, "no_helmet": n, ...}
) -> None:
    """Called by detection routers after each successful inference."""
    with _lock:
        _counters["total_uploads"] += 1
        if engine == "road":
            _counters["road_uploads"] += 1
        else:
            _counters["traffic_uploads"] += 1

        _counters["total_detections"] += total_detections
        _counters["high_priority_count"] += priority_counts.get("High", 0)
        _counters["medium_priority_count"] += priority_counts.get("Medium", 0)
        _counters["low_priority_count"] += priority_counts.get("Low", 0)

        for cls, count in class_counts.items():
            _counters["class_counts"][cls] += count


def get_snapshot() -> dict:
    """Return a JSON-serialisable copy of current counters."""
    with _lock:
        return {
            "total_uploads": _counters["total_uploads"],
            "road_uploads": _counters["road_uploads"],
            "traffic_uploads": _counters["traffic_uploads"],
            "total_detections": _counters["total_detections"],
            "high_priority_count": _counters["high_priority_count"],
            "medium_priority_count": _counters["medium_priority_count"],
            "low_priority_count": _counters["low_priority_count"],
            "class_counts": dict(_counters["class_counts"]),
        }


# ── Endpoints ────────────────────────────────────────────────────────────────

@router.get("")
async def get_stats() -> dict:
    """Return current session-scoped detection aggregates."""
    return get_snapshot()


@router.post("/reset", status_code=204)
async def reset_stats() -> None:
    """Reset all counters to zero (for testing / admin)."""
    with _lock:
        _counters["total_uploads"] = 0
        _counters["road_uploads"] = 0
        _counters["traffic_uploads"] = 0
        _counters["total_detections"] = 0
        _counters["high_priority_count"] = 0
        _counters["medium_priority_count"] = 0
        _counters["low_priority_count"] = 0
        _counters["class_counts"] = defaultdict(int)
