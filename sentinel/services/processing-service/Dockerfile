FROM python:3.12-slim

WORKDIR /app

COPY services/common/python_common /app/services/common/python_common
COPY services/processing-service /app/services/processing-service

RUN pip install --no-cache-dir -e /app/services/common/python_common && \
    pip install --no-cache-dir -r /app/services/processing-service/requirements.txt

WORKDIR /app/services/processing-service

CMD ["python", "app/worker.py"]

