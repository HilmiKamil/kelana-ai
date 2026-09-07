# ---------------------------------------------------------------------------
# KelanaAI Backend — Dockerfile
# Base: official Python 3.12 slim image (matches local .venv Python version)
# Uses pip directly — no uv, no pyproject.toml required.
# ---------------------------------------------------------------------------

FROM python:3.12-slim

# Set working directory inside the container
WORKDIR /app

# Install system-level build dependencies required by psycopg2-binary and bcrypt
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        gcc \
        libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy only the dependency file first (leverages Docker layer cache).
# If requirement.txt hasn't changed, this layer is reused on rebuilds.
COPY requirement.txt .

# Install Python dependencies with pip — no uv, no virtual env needed inside Docker.
# --no-cache-dir keeps the image smaller.
RUN pip install --no-cache-dir -r requirement.txt

# Copy application source code
COPY . .

# Expose the port uvicorn will listen on
EXPOSE 8000

# Run the FastAPI app with uvicorn.
# --host 0.0.0.0 binds to all interfaces so the container port is reachable.
# Secrets (DATABASE_URL, AWS keys, SECRET_KEY) must be injected at runtime
# via environment variables — never baked into the image.
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
