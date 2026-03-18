import os
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from speciesnet import SpeciesNetClassifier

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

classifier = None

@app.on_event("startup")
async def startup_event():
    global classifier
    print("Loading SpeciesNet model...")
    try:
        classifier = SpeciesNetClassifier()
        print("SpeciesNet model loaded successfully.")
    except Exception as e:
        print(f"Error loading model: {e}")

@app.post("/identify")
async def identify_bird(image: UploadFile = File(...)):
    global classifier
    if not classifier:
        raise HTTPException(status_code=500, detail="Classifier model not loaded")
    
    temp_path = f"temp_{image.filename}"
    try:
        contents = await image.read()
        with open(temp_path, "wb") as f:
            f.write(contents)
            
        preds = classifier.predict([temp_path])
        
        species = "Unknown Bird"
        conf = 0
        
        if hasattr(preds, 'to_dict'):
            preds_dict = preds.to_dict(orient='records')[0]
            species = preds_dict.get('prediction', preds_dict.get('category', 'Unknown'))
            score = preds_dict.get('score', preds_dict.get('confidence', 0.0))
            if isinstance(score, (float, int)):
                conf = int(score * 100) if score <= 1.0 else int(score)
        elif isinstance(preds, list) and len(preds) > 0:
            pred = preds[0]
            if isinstance(pred, dict):
                species = pred.get('prediction', pred.get('category', 'Unknown'))
                score = pred.get('score', pred.get('confidence', 0.0))
                if isinstance(score, (float, int)):
                    conf = int(score * 100) if score <= 1.0 else int(score)
                
        return {"species": str(species), "confidence": conf}
    except Exception as e:
        print(f"Error during prediction: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)
