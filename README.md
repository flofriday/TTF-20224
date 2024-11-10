# TTF-2024

Our entry for the [Tourism Tech Festival 2.0](https://tourism-technology.com/) (2024)

## Prerequisites

- Python 3.8+
- Node.js and npm
- Docker (optional, for containerized setup)

## Installation & Setup

### Backend Setup

1. Set up Python environment:
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows use: .\venv\Scripts\activate
pip install -r requirements.txt
```

2. Download required YOLO model files:
```bash
# Download YOLOv3 weights
wget https://pjreddie.com/media/files/yolov3.weights -P models/

# Download configuration file
wget https://raw.githubusercontent.com/pjreddie/darknet/master/cfg/yolov3.cfg -P models/

# Download COCO class names
wget https://raw.githubusercontent.com/pjreddie/darknet/master/data/coco.names -P models/
```

3. Fill out the `backend/data/ski_resorts.json` file with the correct data. Example:  
```json
{
  "resorts": [
    {
      "name": "Obertauern",
      "location": "Salzburg, Austria",
      "description": "One of Austria's most snow-sure winter sports destinations",
      "website": "https://www.obertauern.com"
    }
  ]
}
```

4. Load resort data and start the server:
```bash
python scripts/load_resort_data.py
uvicorn app.main:app --reload
```

The backend will be available at http://localhost:8000

### Frontend Setup

In a new terminal:
```bash
cd frontend  # Navigate to frontend directory
npm install
npm run dev
```

The frontend will be available at http://localhost:3000

## Docker Setup (Alternative)

For a containerized setup, simply run:
```bash
docker compose up
```

This will start both frontend and backend services in containers.

## Development

### Code Style

We maintain code quality through automated formatting:

- **Python**: We use either [ruff](https://github.com/astral-sh/ruff) or [black](https://github.com/psf/black)
- **TypeScript/HTML/CSS**: We use [prettier](https://prettier.io/)

Run the formatters before submitting any changes.

## Contributing

Contributions are welcome! Feel free to:
- Submit bug reports
- Propose new features
- Create pull requests

We appreciate your interest in improving this project! 😊✨