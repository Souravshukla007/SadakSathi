"""Saving uploaded videos for the detectors: stop at the size limit, refuse files that aren't video."""

from __future__ import annotations

from pathlib import Path
from typing import BinaryIO

from fastapi import HTTPException

# One limit for every video route, matching the 100 MB the upload page promises (and Caddy/Next allow).
MAX_VIDEO_SIZE = 100 * 1024 * 1024
_CHUNK = 1024 * 1024


def save_video(src: BinaryIO, dest: Path, max_bytes: int = MAX_VIDEO_SIZE) -> None:
    """Copy the upload to `dest`, stopping as soon as it passes `max_bytes` (no full write first)."""
    written = 0
    with open(dest, "wb") as out:
        while chunk := src.read(_CHUNK):
            written += len(chunk)
            if written > max_bytes:
                raise HTTPException(status_code=413, detail=f"Video too large. Maximum allowed size is {max_bytes // (1024 * 1024)} MB.")
            out.write(chunk)


def ensure_readable_video(path: Path) -> None:
    """A file OpenCV can't read is bad input (400), not a server fault. Checked before taking a model copy."""
    import cv2  # local import: CI imports the routers without OpenCV

    cap = cv2.VideoCapture(str(path))
    try:
        readable = cap.isOpened() and cap.read()[0]
    finally:
        cap.release()
    if not readable:
        raise HTTPException(status_code=400, detail="This file isn't a readable video. Try an MP4, AVI or MOV file.")
