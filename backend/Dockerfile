FROM python:3.13-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

# FIXME: Remove this in the future
RUN python scripts/seed_data.py

CMD ["uvicorn", "app.main:app"]