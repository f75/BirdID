"""
BirdID Backend — Flask server wrapping SpeciesNet
Place this file on your Google Cloud VM alongside the BirdID repo.

Requirements (install in your speciesnet venv):
    pip install flask flask-cors speciesnet pillow

Run:
    python birdid_server.py              # default port 5000
    python birdid_server.py --port 8080  # custom port

Firewall: open the chosen TCP port on GCP
    gcloud compute firewall-rules create birdid-api \
        --allow tcp:5000 \
        --target-tags birdid-server \
        --description "BirdID SpeciesNet API"
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

# ── SpeciesNet imports ───────────────────────────────────────────────────────
from speciesnet import SpeciesNet                  # main ensemble
# If your install exposes run_model directly, fall back to the module API.
# Adjust if your SpeciesNet version has a different import path.

# ── App setup ────────────────────────────────────────────────────────────────
logging.basicConfig(level=logging.INFO, format="%(asctime)s  %(levelname)s  %(message)s")
log = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)           # allow the React front-end (different origin) to POST

# ── Load model once at startup ───────────────────────────────────────────────
log.info("Loading SpeciesNet ensemble — this may take a moment…")
model = SpeciesNet()
log.info("SpeciesNet ready.")

UPLOAD_FOLDER = tempfile.gettempdir()
ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png", "webp", "gif", "bmp", "tiff"}


def allowed(filename: str) -> bool:
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def parse_geo(request_form) -> dict:
    """Extract optional geographic filters from form data."""
    geo = {}
    country = request_form.get("country", "").strip().upper()
    state   = request_form.get("state",   "").strip().upper()
    if country:
        geo["country"] = country
        if state:
            geo["state"] = state
    return geo


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "model": "SpeciesNet"})


@app.route("/predict", methods=["POST"])
def predict():
    """
    Accepts a multipart/form-data POST with:
        image   — image file (required)
        country — ISO 3166-1 alpha-3 code, e.g. "USA" (optional)
        state   — two-letter state code, e.g. "CA"      (optional, USA only)

    Returns JSON:
        {
            "predictions": [
                {
                    "label": "Turdus migratorius",
                    "common_name": "American Robin",
                    "score": 0.97,
                    ...
                },
                ...
            ],
            "prediction_source": "classifier",   // or "detector", "ensemble", etc.
            "filepath": "filename.jpg"
        }
    """
    if "image" not in request.files:
        return jsonify({"error": "No image file in request (key must be 'image')"}), 400

    file = request.files["image"]
    if file.filename == "":
        return jsonify({"error": "Empty filename"}), 400
    if not allowed(file.filename):
        return jsonify({"error": f"Unsupported file type. Allowed: {ALLOWED_EXTENSIONS}"}), 400

    # Save to a temp file — SpeciesNet works from file paths
    suffix = "." + file.filename.rsplit(".", 1)[-1].lower()
    tmp_path = os.path.join(UPLOAD_FOLDER, f"birdid_{uuid.uuid4().hex}{suffix}")
    try:
        file.save(tmp_path)
        log.info("Saved upload to %s", tmp_path)

        # Validate image is readable
        with Image.open(tmp_path) as img:
            img.verify()

        # ── Build SpeciesNet input dict ──────────────────────────────────────
        instance = {"filepath": tmp_path}
        geo = parse_geo(request.form)
        if geo:
            instance.update(geo)

        instances = {"instances": [instance]}

        # ── Run inference ───────────────────────────────────────────────────
        log.info("Running SpeciesNet on %s (geo=%s)", tmp_path, geo or "none")
        raw = model.predict(instances)
        log.info("SpeciesNet raw output: %s", raw)

        # ── Normalise output ────────────────────────────────────────────────
        # SpeciesNet returns: {"predictions": [{"filepath":…, "label":…, "score":…, ...}]}
        # We enrich with common names if available and strip the temp path.
        preds_raw = raw.get("predictions", [raw]) if isinstance(raw, dict) else [raw]

        predictions = []
        for p in preds_raw:
            if isinstance(p, dict):
                entry = {
                    "label": p.get("label") or p.get("classification") or "",
                    "scientific_name": p.get("scientific_name") or _extract_sci(p.get("label", "")),
                    "common_name": p.get("common_name") or p.get("label") or "",
                    "score": float(p.get("score") or p.get("confidence") or p.get("probability") or 0),
                    "prediction_source": p.get("prediction_source") or p.get("source") or "",
                }
                predictions.append(entry)

        # Sort by score descending
        predictions.sort(key=lambda x: x["score"], reverse=True)

        response = {
            "predictions": predictions,
            "prediction_source": predictions[0].get("prediction_source", "") if predictions else "",
            "filepath": file.filename,
        }
        return jsonify(response)

    except Exception as exc:
        log.exception("Prediction failed")
        return jsonify({"error": str(exc)}), 500

    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)


def _extract_sci(label: str) -> str:
    """
    SpeciesNet labels are often 'common_name;scientific_name' or just the
    scientific name.  Extract what looks like a scientific name (two words,
    first capitalised, second lowercase).
    """
    if not label:
        return ""
    parts = label.split(";")
    for part in reversed(parts):          # last segment often = scientific
        words = part.strip().split()
        if len(words) >= 2 and words[0][0].isupper() and words[1][0].islower():
            return " ".join(words[:2])
    return label.strip()


# ── Entry point ───────────────────────────────────────────────────────────────
if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="BirdID SpeciesNet API server")
    parser.add_argument("--host", default="0.0.0.0", help="Bind host (default 0.0.0.0)")
    parser.add_argument("--port", type=int, default=5000, help="Port (default 5000)")
    parser.add_argument("--debug", action="store_true", help="Enable Flask debug mode")
    args = parser.parse_args()

    log.info("Starting BirdID server on %s:%d", args.host, args.port)
    app.run(host=args.host, port=args.port, debug=args.debug)
