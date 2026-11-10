FROM python:3.11-slim

# Install ffmpeg and audio libraries required for Discord Voice TTS
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    libffi-dev \
    libnacl-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy and install dependencies first for faster layer caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy bot source code
COPY . .

# Expose default webhook port (Railway and other cloud hosts also map $PORT dynamically)
EXPOSE 5050

CMD ["python", "bot.py"]

