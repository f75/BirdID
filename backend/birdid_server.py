import argparse, logging, os, tempfile, uuid
from flask import Flask, jsonify, request
from flask_cors import CORS
from PIL import Image

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger(__name__)
app = Flask(__name__)
CORS(app)

log.info("Loading SpeciesNet…")
try:
    from speciesnet import SpeciesNet
    model = SpeciesNet(model_name="kaggle:google/speciesnet/pyTorch/v4.0.2a/1")
    log.info("SpeciesNet ready.")
except Exception as e:
    log.error(f"Could not load SpeciesNet: {e}")
    model = None

ALLOWED = {"jpg","jpeg","png","webp","gif","bmp","tiff"}

def allowed(fn):
    return "." in fn and fn.rsplit(".",1)[1].lower() in ALLOWED

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status":"ok","model":"SpeciesNet v4.0.2a","model_loaded":model is not None})

@app.route("/predict", methods=["POST"])
def predict():
    if "image" not in request.files:
        return jsonify({"error":"No image file"}), 400
    f = request.files["image"]
    if not f.filename or not allowed(f.filename):
        return jsonify({"error":"Invalid file"}), 400
    suffix = "." + f.filename.rsplit(".",1)[-1].lower()
    tmp = os.path.join(tempfile.gettempdir(), f"birdid_{uuid.uuid4().hex}{suffix}")
    try:
        f.save(tmp)
        with Image.open(tmp) as img:
            img.verify()
        if model is None:
            return jsonify({"error":"Model not loaded"}), 500
        country = request.form.get("country","").strip().upper() or None
        region = request.form.get("state","").strip().upper() or None
        log.info("Predicting %s country=%s region=%s", tmp, country, region)
        raw = model.predict(
            filepaths=[tmp],
            country=country,
            admin1_region=region,
            run_mode="single_thread",
            progress_bars=False,
        )
        log.info("Result: %s", raw)
        preds = []
        for p in (raw.get("predictions",[]) if isinstance(raw,dict) else []):
            if isinstance(p,dict):
                label = p.get("label","")
                preds.append({
                    "label": label,
                    "common_name": p.get("common_name") or label,
                    "scientific_name": p.get("scientific_name",""),
                    "score": float(p.get("score") or p.get("confidence") or 0),
                    "prediction_source": p.get("prediction_source",""),
                })
        preds.sort(key=lambda x: x["score"], reverse=True)
        return jsonify({"predictions":preds,"raw":raw})
    except Exception as e:
        log.exception("Failed")
        return jsonify({"error":str(e)}), 500
    finally:
        if os.path.exists(tmp):
            os.remove(tmp)

if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--host", default="0.0.0.0")
    p.add_argument("--port", type=int, default=5000)
    a = p.parse_args()
    app.run(host=a.host, port=a.port)
