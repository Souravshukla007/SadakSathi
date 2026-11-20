from __future__ import annotations

import sys
from pathlib import Path

import pytest

BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from config import get_settings  # noqa: E402  (needs BACKEND_DIR on sys.path)


@pytest.fixture(autouse=True)
def _no_api_key_from_local_env(monkeypatch):
    """Tests must not depend on a developer's backend/.env (e.g. a real ML_API_KEY)."""
    monkeypatch.setattr(get_settings(), "ML_API_KEY", "")
