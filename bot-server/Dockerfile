# Dockerfile for the private Python FastAPI bot server

FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

WORKDIR /app

# Install Python dependencies
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY bot_server.py ./
COPY models ./models

# The model is expected at models/ppo_squares2.zip inside the image.
# You can bake it in at build time or mount it as a volume.

EXPOSE 8000

CMD ["uvicorn", "bot_server:app", "--host", "0.0.0.0", "--port", "8000"]
