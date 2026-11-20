# ML backend image (works on Raspberry Pi 4/5 with 64-bit OS, and on x86-64).
FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 PIP_NO_CACHE_DIR=1 PIP_DISABLE_PIP_VERSION_CHECK=1
# OpenCV (pulled in by ultralytics) needs these two system libraries.
RUN apt-get update && apt-get install -y --no-install-recommends libgl1 libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt ncnn

COPY . .
# NCNN exports run much faster than PyTorch on ARM CPUs (and no slower on x86).
RUN python -c "from ultralytics import YOLO; [YOLO(f'models/{m}.pt').export(format='ncnn') for m in ('best_whole_model_nano', 'traffic_model_nano_worse')]"

# The Hugging Face cache must exist (owned by app) before the hf-cache volume mounts on it: Docker
# creates a missing mount point as root, and then every model download fails quietly.
RUN useradd --create-home app && mkdir -p uploads /home/app/.cache/huggingface \
    && chown -R app /app /home/app/.cache
USER app
EXPOSE 8000
CMD ["python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
