FROM python:3.12-slim

WORKDIR /app

COPY services/common/python_common /app/services/common/python_common
COPY services/ingestion-service /app/services/ingestion-service

RUN pip install --no-cache-dir -e /app/services/common/python_common && \
    pip install --no-cache-dir -r /app/services/ingestion-service/requirements.txt

WORKDIR /app/services/ingestion-service

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001"]

