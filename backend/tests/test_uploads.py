import io

import pytest
from fastapi import HTTPException

from ml.uploads import ensure_readable_video, save_video


def test_save_video_stops_at_the_limit(tmp_path):
    dest = tmp_path / "v.mp4"
    with pytest.raises(HTTPException) as too_big:
        save_video(io.BytesIO(b"x" * 3000), dest, max_bytes=1000)
    assert too_big.value.status_code == 413
    assert dest.stat().st_size <= 1000  # never wrote past the limit

    save_video(io.BytesIO(b"x" * 500), dest, max_bytes=1000)
    assert dest.stat().st_size == 500


def test_a_text_file_is_rejected_as_bad_input(tmp_path):
    pytest.importorskip("cv2")
    fake = tmp_path / "not-a-video.mp4"
    fake.write_text("hello, I am not a video")
    with pytest.raises(HTTPException) as bad:
        ensure_readable_video(fake)
    assert bad.value.status_code == 400
