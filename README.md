# TTF-20224
Our entry for the tourism tech festival 2.0 (2024)


python -m venv venv
source venv/bin/activate
pip install fastapi uvicorn sqlalchemy

python backend/scripts/seed_data.py

uvicorn app.main:app --reload