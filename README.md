# BirdID — Bird Species Identifier

Uses Google SpeciesNet AI to identify bird species from photos.

## Live API
- Health: http://34.173.73.193:5000/health
- Predict: POST http://34.173.73.193:5000/predict

## API Usage
```bash
curl -X POST http://34.173.73.193:5000/predict \
  -F "image=@bird.jpg" \
  -F "country=USA" \
  -F "state=CA"
```

## Project Structure
```
BirdID/
├── backend/
│   ├── birdid_server.py       Flask API server
│   └── requirements.txt       Python dependencies
├── src/
│   └── App.jsx                React frontend
├── .github/workflows/
│   └── deploy.yml             GitHub Actions auto-deploy
├── README.md                  This file
├── COMMANDS.md                All commands reference
└── VM_CONFIG.md               VM configuration details
```
