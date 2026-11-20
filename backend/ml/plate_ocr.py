"""
SadakSathi — License Plate OCR Module (Florence-2)

Uses Microsoft Florence-2-base VLM for plate text extraction via <OCR> task.
Replaces EasyOCR to eliminate Rust build dependency.

Model: microsoft/Florence-2-base (~460MB, 0.23B params)
Task:  <OCR> prompt on cropped plate region
"""

from __future__ import annotations

import logging
import re
import threading

import numpy as np

logger = logging.getLogger(__name__)

_florence_model = None
_florence_processor = None
FLORENCE_REVISION = "5ca5edf5bd017b9919c05d08aebef5e4c7ac3bac"  # microsoft/Florence-2-base, pinned
# One shared Florence copy (~1 GB); parallel detection requests take turns for plate reading.
_ocr_lock = threading.Lock()


def load_plate_ocr(
    model_id: str = "microsoft/Florence-2-base",
    device: str = "auto",
) -> bool:
    """
    Load Florence-2 model and processor for OCR.

    Args:
        model_id: HuggingFace model identifier.
                  "microsoft/Florence-2-base"  (~460MB, faster)
                  "microsoft/Florence-2-large" (~1.5GB, more accurate)
        device: "auto", "cpu", or "cuda".

    Returns:
        True if model loaded successfully.
    """
    global _florence_model, _florence_processor

    if _florence_model is not None:
        return True

    try:
        import torch
        from transformers import AutoModelForCausalLM, AutoProcessor

        if device == "auto":
            device = "cuda" if torch.cuda.is_available() else "cpu"

        dtype = torch.float16 if device == "cuda" else torch.float32

        logger.info(f"Loading Florence-2 OCR: {model_id} on {device} ({dtype})")

        # trust_remote_code runs Python from the model repo, so pin an exact commit: a later
        # change (or takeover) of the Hub repo can't run new code here.
        revision = FLORENCE_REVISION if model_id == "microsoft/Florence-2-base" else None
        _florence_processor = AutoProcessor.from_pretrained(
            model_id, trust_remote_code=True, revision=revision
        )
        _florence_model = AutoModelForCausalLM.from_pretrained(
            model_id,
            revision=revision,
            torch_dtype=dtype,
            trust_remote_code=True,
            attn_implementation="eager",   # torch 2.2.2 lacks SDPA attrs Florence-2 expects
        ).to(device)

        logger.info(f"Florence-2 OCR loaded on {device}.")
        return True

    except Exception as e:
        logger.error(f"Failed to load Florence-2: {e}", exc_info=True)
        return False


def read_plate_text(image: np.ndarray, bbox: dict, pad: int = 6) -> str | None:
    """
    Crop the plate region and extract text using Florence-2 <OCR>.

    Drop-in replacement for the EasyOCR read_plate_text() in traffic.py.

    Args:
        image: Full BGR frame (numpy array from OpenCV).
        bbox:  Dict with x1, y1, x2, y2 keys.
        pad:   Padding around bounding box in pixels.

    Returns:
        Cleaned uppercase plate text, or None if OCR failed.
    """
    if _florence_model is None or _florence_processor is None:
        return None

    try:
        import cv2
        import torch
        from PIL import Image

        h, w = image.shape[:2]
        x1 = max(0, bbox["x1"] - pad)
        y1 = max(0, bbox["y1"] - pad)
        x2 = min(w, bbox["x2"] + pad)
        y2 = min(h, bbox["y2"] + pad)

        crop = image[y1:y2, x1:x2]
        if crop.size == 0:
            return None

        # BGR -> RGB -> PIL
        rgb = cv2.cvtColor(crop, cv2.COLOR_BGR2RGB)
        pil_img = Image.fromarray(rgb)

        # Florence-2 OCR
        task = "<OCR>"
        device = next(_florence_model.parameters()).device

        inputs = _florence_processor(
            text=task, images=pil_img, return_tensors="pt"
        ).to(device)

        with _ocr_lock, torch.no_grad():
            generated_ids = _florence_model.generate(
                input_ids=inputs["input_ids"],
                pixel_values=inputs["pixel_values"],
                max_new_tokens=64,
                num_beams=1,
                do_sample=False,
                use_cache=False,    # Florence-2 remote code KV-cache is broken on torch 2.2.2
            )

        raw_text = _florence_processor.batch_decode(
            generated_ids, skip_special_tokens=True
        )[0]

        cleaned = _clean_indian_plate(raw_text)
        return cleaned if cleaned else None

    except Exception as e:
        logger.warning(f"Florence-2 OCR failed: {e}")
        return None


def _clean_indian_plate(raw: str) -> str:
    """
    Clean extracted plate text for Indian plates.

    Indian plates: MH 12 AB 1234, KA 01 CD 5678, AP 21 BC 2008
    """
    text = raw.upper().strip()
    text = re.sub(r"[^A-Z0-9\s]", "", text)
    text = re.sub(r"\s+", " ", text).strip()

    if not text:
        return ""

    # OCR corrections in numeric portions
    parts = text.split()
    if len(parts) >= 2:
        last = parts[-1]
        digit_ratio = sum(c.isdigit() for c in last) / max(len(last), 1)
        if digit_ratio > 0.5:
            last = last.replace("O", "0").replace("I", "1")
            parts[-1] = last
        text = " ".join(parts)

    return text
