# Multi-platform Python base image
FROM python:3.11-slim

# Prevent Python from writing bytecode and buffer stdout/stderr
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PORT=7860
ENV HOME=/app

# Install system dependencies required for OpenCV, EasyOCR, and PDF generation
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Pre-install PyTorch (CPU version) to keep Docker image small (< 1 GB instead of 3.5 GB)
RUN pip install --no-cache-dir torch torchvision --index-url https://download.pytorch.org/whl/cpu

# Install requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy project source files
COPY . .

# Ensure evidence directories exist and are writable
RUN mkdir -p evidence/original evidence/plates && (chmod -R 777 evidence anpr_history.db 2>/dev/null || true)

# Support non-root container environments (like Hugging Face Spaces UID 1000)
RUN useradd -m -u 1000 user || true
RUN chown -R 1000:1000 /app || true
USER 1000

# Expose default port
EXPOSE 7860

# Start production server
CMD ["sh", "-c", "gunicorn --bind 0.0.0.0:${PORT:-7860} --timeout 180 --workers 1 --threads 4 app:app"]
