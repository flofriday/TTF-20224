# TTF-2024
Our entry for the [tourism tech festival 2.0](https://tourism-technology.com/) (2024)

## Run it locally

Start the backend with: 

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

python scripts/seed_data.py

uvicorn app.main:app --reload
```

And the frontend with:

```bash
npm install
npm run dev
```

## Run with docker compose 

```
docker compose up
```

## Contributing

For python code we use [ruff](https://github.com/astral-sh/ruff) or 
[black](https://github.com/psf/black) (both compatible) to format the code and
for typescript we use [prettier](https://prettier.io/).
