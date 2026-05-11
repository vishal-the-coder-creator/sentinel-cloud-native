FROM python:3.12-slim

WORKDIR /app

COPY services/common/python_common /app/services/common/python_common
COPY services/analytics-service /app/services/analytics-service

RUN pip install --no-cache-dir -e /app/services/common/python_common && \
    pip install --no-cache-dir -r /app/services/analytics-service/requirements.txt

WORKDIR /app/services/analytics-service

CMD ["python", "app/worker.py"]

