FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
# pip bundled with python:3.12-slim still has CVE-2026-6357 / CVE-2026-13346
# (fixed in 26.1 / 26.2). It is never invoked at runtime, but it ships in the image.
RUN pip install --no-cache-dir --upgrade "pip>=26.2" && \
    pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
