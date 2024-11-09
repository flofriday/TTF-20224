# TTF-2024
Our entry for the [tourism tech festival 2.0](https://tourism-technology.com/) (2024)

## Run it locally

Start the backend with: 

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```
Download the yolov3 weights, cfg and coco.names from https://pjreddie.com/darknet/yolo/  
```bash
wget https://pjreddie.com/media/files/yolov3.weights -P models/

wget https://raw.githubusercontent.com/pjreddie/darknet/master/cfg/yolov3.cfg -P models/

wget https://raw.githubusercontent.com/pjreddie/darknet/master/data/coco.names -P models/
```

```bash
python scripts/seed_data.py

uvicorn app.main:app --reload
```

In another terminal start the frontend with:

```bash
npm install
npm run dev
```

With that the frontend should be running on http://localhost:3000 and the backend on http://localhost:8000.

## Run with docker compose 

```
docker compose up
```

## Contributing

Contributions are quite welcome, you are awesome 😊✨

We don't have a strict code style but instead 
heavily rely on automation and what ever the tool produces is _correct_.

For python code we use [ruff](https://github.com/astral-sh/ruff) or 
[black](https://github.com/psf/black) (both compatible) to format the code and
for Typescript, HTML and CSS we use [prettier](https://prettier.io/).
