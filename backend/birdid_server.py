"""
BirdID Backend — Flask server wrapping SpeciesNet
"""
import argparse
import io
import logging
import os
import tempfile
import uuid

from flask import Flask, jsonify, request
from flask_cors import CORS
from PIL import Image

logging.basicConfig(level=logging.INFO, format="%(asctime)s  %(levelname)s  %(message)s")
log = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

log.info("Loading SpeciesNet ensemble — this may take a moment…")
try:
    from speciesnet import SpeciesNet
    model = SpeciesNet()
    log.info("SpeciesNet ready.")
except Exception as e:
    log.warning(f"Could not load SpeciesNet: {e}. Running in demo mode.")
    model = None

UPLOAD_FOLDER = tempfile.gettempdir()
ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png", "webp", "gif", "bmp", "tiff"}


def allowed(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "model": "SpeciesNet", "model_loaded": model is not None})


@app.route("/predict", methods=["POST"])
def predict():
    if "image" not in request.files:
        return jsonify({"error": "No image file in request (key must be 'image')"}), 400

    file = request.files["image"]
    if file.filename == "":
        return jsonify({"error": "Empty filename"}), 400
    if not allowed(file.filename):
        return jsonify({"error": f"Unsupported file type. Allowed: {ALLOWED_EXTENSIONS}"}), 400

    suffix = "." + file.filename.rsplit(".", 1)[-1].lower()
    tmp_path = os.path.join(UPLOAD_FOLDER, f"birdid_{uuid.uuid4().hex}{suffix}")

    try:
        file.save(tmp_path)
        log.info("Saved upload to %s", tmp_path)

        with Image.open(tmp_path) as img:
            img.verify()

        if model is None:
            return jsonify({"error": "SpeciesNet model not loaded"}), 500

        country = request.form.get("country", "").strip().upper()
        state = request.form.get("state", "").strip().upper()

        instance = {"filepath": tmp_path}
        if country:
            instance["country"] = country
        if state:
            instance["state"] = state

        instances = {"instances": [instance]}

        log.info("Running SpeciesNet on %s", tmp_path)
        raw = model.predict(instances)
        log.info("Raw output: %s", raw)

        preds_raw = raw.get("predictions", [raw]) if isinstance(raw, dict) else [raw]

        predictions = []
        for p in preds_raw:
            if isinstance(p, dict):
                label = p.get("label") or p.get("classification") or ""
                entry = {
                    "label": label,
                    "scientific_name": p.get("scientific_name") or _extract_sci(label),
                    "common_name": p.get("common_name") or label,
                    "score": float(p.get("score") or p.get("confidence") or p.get("probability") or 0),
                    "prediction_source": p.get("prediction_source") or "",
                }
                predictions.append(entry)

        predictions.sort(key=lambda x: x["score"], reverse=True)

        return jsonify({
            "predictions": predictions,
            "prediction_source": predictions[0].get("prediction_source", "") if predictions else "",
            "filepath": file.filename,
        })

    except Exception as exc:
        log.exception("Prediction failed")
        return jsonify({"error": str(exc)}), 500

    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)


def _extract_sci(label):
    if not label:
        return ""
    parts = label.split(";")
    for part in reversed(parts):
        words = part.strip().split()
        if len(words) >= 2 and words[0][0].isupper() and words[1][0].islower():
            return " ".join(words[:2])
    return label.strip()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--host", default="0.0.0.0")
    parser.add_argument("--port", type=int, default=5000)
    parser.add_argument("--debug", action="store_true")
    args = parser.parse_args()
    log.info("Starting BirdID server on %s:%d", args.host, args.port)
    app.run(host=args.host, port=args.port, debug=args.debug)
