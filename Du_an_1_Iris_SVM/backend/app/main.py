"""
Iris Classification API — Multi-kernel SVM with SQLite database.

Features:
  - 4 SVM kernel versions (linear, rbf, poly, sigmoid)
  - SQLite database for user prediction history
  - Export predictions to Excel (.xlsx)
  - Decision boundary grid for visualization
"""

import json
import os
import sqlite3
import io
from datetime import datetime, timezone
from pathlib import Path

import joblib
import numpy as np
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field


# ─── Paths ───
BASE_DIR = Path(__file__).resolve().parents[1]
ARTIFACT_DIR = BASE_DIR / "artifacts"
METADATA_PATH = ARTIFACT_DIR / "metadata.json"
DB_PATH = BASE_DIR / "data" / "predictions.db"

# ─── Load metadata & models ───
metadata = json.loads(METADATA_PATH.read_text(encoding="utf-8"))

models = {}
for m in metadata["models"]:
    model_path = ARTIFACT_DIR / m["model_file"]
    models[m["kernel"]] = joblib.load(model_path)

DEFAULT_KERNEL = metadata.get("default_kernel", "rbf")


# ─── Database setup ───
def init_db():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(DB_PATH))
    conn.execute("""
        CREATE TABLE IF NOT EXISTS user_predictions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sepal_length REAL NOT NULL,
            sepal_width REAL NOT NULL,
            petal_length REAL NOT NULL,
            petal_width REAL NOT NULL,
            kernel TEXT NOT NULL,
            prediction TEXT NOT NULL,
            class_id INTEGER NOT NULL,
            probability REAL NOT NULL,
            model_version TEXT NOT NULL,
            created_at TEXT NOT NULL
        )
    """)
    conn.commit()
    conn.close()

init_db()

def get_db():
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn


# ─── CORS ───
def configured_origins() -> list[str]:
    default_origins = [
        "https://iris-svm-frontend-6s3t.onrender.com",
        "http://localhost:5500",
        "http://127.0.0.1:5500",
    ]
    raw_origins = os.getenv("FRONTEND_ORIGINS", "")
    origins = [origin.strip().rstrip("/") for origin in raw_origins.split(",")]
    return [origin for origin in origins if origin] or default_origins


# ─── App ───
app = FastAPI(
    title="Iris Classification API",
    description="Multi-kernel SVM classifier for the Iris dataset with prediction history",
    version=metadata["model_version"],
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=configured_origins(),
    allow_credentials=False,
    allow_methods=["GET", "POST", "DELETE"],
    allow_headers=["Content-Type"],
)


# ─── Schemas ───
class IrisInput(BaseModel):
    sepal_length: float = Field(ge=4.0, le=8.0)
    sepal_width: float = Field(ge=2.0, le=5.0)
    petal_length: float = Field(ge=1.0, le=7.0)
    petal_width: float = Field(ge=0.1, le=3.0)
    kernel: str = Field(default="rbf", pattern="^(linear|rbf|poly|sigmoid)$")


class IrisPrediction(BaseModel):
    id: int
    class_id: int
    prediction: str
    probability: float
    kernel: str
    model_version: str


class PredictionRecord(BaseModel):
    id: int
    sepal_length: float
    sepal_width: float
    petal_length: float
    petal_width: float
    kernel: str
    prediction: str
    class_id: int
    probability: float
    model_version: str
    created_at: str


# ─── Endpoints ───

@app.get("/")
def home():
    return {
        "service": "Iris SVM API (Multi-Kernel)",
        "docs": "/docs",
        "version": metadata["model_version"],
        "available_kernels": [m["kernel"] for m in metadata["models"]],
    }


@app.get("/health")
def health():
    return {
        "status": "ok",
        "models_loaded": list(models.keys()),
        "model_version": metadata["model_version"],
    }


@app.get("/metadata")
def get_metadata():
    return metadata


@app.get("/models")
def list_models():
    """List all available SVM model versions."""
    return {
        "default_kernel": DEFAULT_KERNEL,
        "models": metadata["models"],
    }


@app.post("/predict", response_model=IrisPrediction)
def predict(data: IrisInput):
    """Predict iris species using selected kernel version."""
    kernel = data.kernel
    if kernel not in models:
        raise HTTPException(status_code=400, detail=f"Kernel '{kernel}' not available")

    model = models[kernel]
    features = np.array(
        [[data.sepal_length, data.sepal_width, data.petal_length, data.petal_width]],
        dtype=float,
    )
    if not np.isfinite(features).all():
        raise HTTPException(status_code=422, detail="Features must be finite numbers")

    prediction_idx = int(model.predict(features)[0])
    label = metadata["class_mapping"].get(str(prediction_idx))
    if label is None:
        raise HTTPException(status_code=500, detail="Model returned an unknown class")

    probability = float(model.predict_proba(features)[0][prediction_idx])

    # Save to database
    conn = get_db()
    now = datetime.now(timezone.utc).isoformat()
    cursor = conn.execute(
        """INSERT INTO user_predictions
           (sepal_length, sepal_width, petal_length, petal_width, kernel, prediction, class_id, probability, model_version, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (data.sepal_length, data.sepal_width, data.petal_length, data.petal_width,
         kernel, label, prediction_idx, probability, metadata["model_version"], now),
    )
    conn.commit()
    record_id = cursor.lastrowid
    conn.close()

    return IrisPrediction(
        id=record_id,
        class_id=prediction_idx,
        prediction=label,
        probability=probability,
        kernel=kernel,
        model_version=metadata["model_version"],
    )


@app.get("/predictions", response_model=list[PredictionRecord])
def get_predictions(limit: int = Query(default=50, le=500)):
    """Get prediction history from database."""
    conn = get_db()
    rows = conn.execute(
        "SELECT * FROM user_predictions ORDER BY id DESC LIMIT ?", (limit,)
    ).fetchall()
    conn.close()
    return [dict(row) for row in rows]


@app.delete("/predictions")
def clear_predictions():
    """Clear all prediction history."""
    conn = get_db()
    conn.execute("DELETE FROM user_predictions")
    conn.commit()
    conn.close()
    return {"status": "cleared"}


@app.get("/predictions/export")
def export_predictions():
    """Export all predictions as Excel file (.xlsx)."""
    try:
        import openpyxl
    except ImportError:
        raise HTTPException(status_code=500, detail="openpyxl not installed")

    conn = get_db()
    rows = conn.execute("SELECT * FROM user_predictions ORDER BY id DESC").fetchall()
    conn.close()

    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Iris Predictions"

    # Header
    headers = ["ID", "Sepal Length", "Sepal Width", "Petal Length", "Petal Width",
               "Kernel", "Prediction", "Class ID", "Probability", "Model Version", "Created At"]
    ws.append(headers)

    # Style header
    from openpyxl.styles import Font, PatternFill
    header_font = Font(bold=True, color="FFFFFF")
    header_fill = PatternFill(start_color="593E67", end_color="593E67", fill_type="solid")
    for cell in ws[1]:
        cell.font = header_font
        cell.fill = header_fill

    # Data
    for row in rows:
        ws.append([
            row["id"], row["sepal_length"], row["sepal_width"],
            row["petal_length"], row["petal_width"], row["kernel"],
            row["prediction"], row["class_id"],
            round(row["probability"] * 100, 1),
            row["model_version"], row["created_at"],
        ])

    # Auto-width
    for col in ws.columns:
        max_len = max(len(str(cell.value or "")) for cell in col)
        ws.column_dimensions[col[0].column_letter].width = max_len + 3

    # Save to buffer
    buf = io.BytesIO()
    wb.save(buf)
    buf.seek(0)

    return StreamingResponse(
        buf,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=iris_predictions.xlsx"},
    )


@app.get("/decision-boundary")
def decision_boundary(
    kernel: str = Query(default="rbf", pattern="^(linear|rbf|poly|sigmoid)$"),
    feature_x: str = Query(default="petal_length"),
    feature_y: str = Query(default="petal_width"),
    resolution: int = Query(default=60, ge=20, le=100),
):
    """
    Generate a decision boundary grid for visualization.
    Returns a 2D grid of predicted class IDs.
    """
    if kernel not in models:
        raise HTTPException(status_code=400, detail=f"Kernel '{kernel}' not available")

    feature_names = metadata["feature_names"]
    try:
        idx_x = feature_names.index(feature_x)
        idx_y = feature_names.index(feature_y)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid feature name")

    from sklearn import datasets
    iris = datasets.load_iris()
    X = iris.data

    # Grid bounds with padding
    x_min, x_max = X[:, idx_x].min() - 0.5, X[:, idx_x].max() + 0.5
    y_min, y_max = X[:, idx_y].min() - 0.5, X[:, idx_y].max() + 0.5

    xx = np.linspace(x_min, x_max, resolution)
    yy = np.linspace(y_min, y_max, resolution)
    xx_grid, yy_grid = np.meshgrid(xx, yy)

    # Build feature matrix: fill non-selected features with median values
    grid_points = np.full((xx_grid.size, 4), 0.0)
    medians = np.median(X, axis=0)
    for i in range(4):
        grid_points[:, i] = medians[i]
    grid_points[:, idx_x] = xx_grid.ravel()
    grid_points[:, idx_y] = yy_grid.ravel()

    model = models[kernel]
    preds = model.predict(grid_points).astype(int).tolist()

    return {
        "kernel": kernel,
        "x_range": [float(x_min), float(x_max)],
        "y_range": [float(y_min), float(y_max)],
        "resolution": resolution,
        "grid": [preds[i * resolution:(i + 1) * resolution] for i in range(resolution)],
    }
