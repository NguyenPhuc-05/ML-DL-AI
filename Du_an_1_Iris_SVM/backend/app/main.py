import json
import os
from pathlib import Path

import joblib
import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field


BASE_DIR = Path(__file__).resolve().parents[1]
MODEL_PATH = BASE_DIR / "artifacts" / "iris_svm.joblib"
METADATA_PATH = BASE_DIR / "artifacts" / "metadata.json"

model = joblib.load(MODEL_PATH)
metadata = json.loads(METADATA_PATH.read_text(encoding="utf-8"))


def configured_origins() -> list[str]:
    default_origins = [
        "https://iris-svm-frontend-6s3t.onrender.com",
        "http://localhost:5500",
        "http://127.0.0.1:5500",
    ]
    raw_origins = os.getenv("FRONTEND_ORIGINS", "")
    origins = [origin.strip().rstrip("/") for origin in raw_origins.split(",")]
    return [origin for origin in origins if origin] or default_origins


app = FastAPI(
    title="Iris Classification API",
    description="Educational SVM classifier for the Iris dataset",
    version=metadata["model_version"],
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=configured_origins(),
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)


class IrisInput(BaseModel):
    sepal_length: float = Field(ge=4.0, le=8.0)
    sepal_width: float = Field(ge=2.0, le=5.0)
    petal_length: float = Field(ge=1.0, le=7.0)
    petal_width: float = Field(ge=0.1, le=3.0)


class IrisPrediction(BaseModel):
    class_id: int
    prediction: str
    model_version: str


@app.get("/")
def home():
    return {
        "service": "Iris SVM API",
        "docs": "/docs",
        "warning": metadata["warning"],
    }


@app.get("/health")
def health():
    return {
        "status": "ok",
        "model_loaded": model is not None,
        "model_version": metadata["model_version"],
    }


@app.get("/metadata")
def get_metadata():
    return metadata


@app.post("/predict", response_model=IrisPrediction)
def predict(data: IrisInput):
    features = np.array(
        [[data.sepal_length, data.sepal_width, data.petal_length, data.petal_width]],
        dtype=float,
    )
    if not np.isfinite(features).all():
        raise HTTPException(status_code=422, detail="Features must be finite numbers")

    prediction = int(model.predict(features)[0])
    label = metadata["class_mapping"].get(str(prediction))
    if label is None:
        raise HTTPException(status_code=500, detail="Model returned an unknown class")

    return IrisPrediction(
        class_id=prediction,
        prediction=label,
        model_version=metadata["model_version"],
    )

