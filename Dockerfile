FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir --prefer-binary --upgrade pip && pip install --no-cache-dir --prefer-binary -r requirements.txt
COPY . .
# Render inyecta PORT, app.py lee PORT
EXPOSE 10000
CMD ["python", "app.py"]
