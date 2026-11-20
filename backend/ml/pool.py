"""Lends model copies to requests, one request per copy at a time.

Ultralytics models keep per-call state (predictor args, tracker), so two requests must never use
the same copy at once. With one copy this behaves like a lock (PARALLEL_PROCESSING=false); with N
copies, N requests run at the same time (torch releases the GIL during inference).
"""

from __future__ import annotations

import queue
from contextlib import contextmanager

from fastapi import HTTPException

# How long a request waits for a free model copy. Without a limit, a burst of long videos queues
# jobs for hours, each holding a server thread, until even the quick duplicate checks time out.
WAIT_SECONDS = 30


class ModelPool:
    def __init__(self, models: list):
        self.size = len(models)
        self._free: queue.Queue = queue.Queue()
        for m in models:
            self._free.put(m)

    @contextmanager
    def acquire(self, timeout: float = WAIT_SECONDS):
        try:
            model = self._free.get(timeout=timeout)  # waits while every copy is busy
        except queue.Empty:
            raise HTTPException(status_code=503, detail="The detector is busy with other scans. Try again in a minute.")
        try:
            yield model
        finally:
            self._free.put(model)


def pool_for(app_state, name: str) -> ModelPool | None:
    """The pool stored on app.state (built at startup), or a one-copy pool around app.state.<name>."""
    pool = getattr(app_state, f"{name}_pool", None)
    if pool is None and getattr(app_state, name, None) is not None:
        pool = ModelPool([getattr(app_state, name)])
        setattr(app_state, f"{name}_pool", pool)
    return pool
