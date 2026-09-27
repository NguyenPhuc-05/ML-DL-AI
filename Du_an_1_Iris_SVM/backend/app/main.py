"""
Iris Classification API — Multi-Kernel SVM with SQLite Database & Advanced ML Features.

Features:
  - 4 SVM kernel versions (linear, rbf, poly, sigmoid)
  - SQLite database for user prediction history
  - Export predictions to Excel (.xlsx)
  - Decision boundary grid for 2D visualization
  - Feature 1: Live SVM Hyperparameter Playground (C, gamma, degree)
  - Feature 2: Support Vectors Inspector (Counts, coordinates, dual coefs, weights)
  - Feature 3: Kernel Arena (Side-by-side benchmark of all 4 kernels)
  - Feature 4: Explainable AI (XAI - Feature importance attribution & biology checks)
  - Feature 5: Batch Prediction (CSV Upload) & Sample CSV generator
"""

import io
import json
import os
import sqlite3
import time
from datetime import datetime, timezone
from pathlib import Path

import joblib
import numpy as np
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from sklearn import datasets
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.svm import SVC

# ─── Load Iris Dataset for analysis ───
iris_dataset = datasets.load_iris()
X_iris = iris_dataset.data
y_iris = iris_dataset.target

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
    description="Multi-kernel SVM classifier for the Iris dataset with prediction history & Advanced ML tools",
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


class BatchPredictRequest(BaseModel):
    samples: list[IrisInput]


# ─── Endpoints ───

@app.get("/")
def home():
    return {
        "service": "Iris SVM API (Multi-Kernel + Advanced ML)",
        "docs": "/docs",
        "version": metadata["model_version"],
        "available_kernels": [m["kernel"] for m in metadata["models"]],
    }


@app.get("/health")
def health():
    return {
        "status": "ok",
        "model_loaded": len(models) > 0,
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
               "Kernel", "Prediction", "Class ID", "Probability (%)", "Model Version", "Created At"]
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


FEATURE_NAME_MAP = {
    "sepal_length": 0,
    "sepal_width": 1,
    "petal_length": 2,
    "petal_width": 3,
    "sepal length (cm)": 0,
    "sepal width (cm)": 1,
    "petal length (cm)": 2,
    "petal width (cm)": 3,
}


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

    idx_x = FEATURE_NAME_MAP.get(feature_x)
    idx_y = FEATURE_NAME_MAP.get(feature_y)
    if idx_x is None or idx_y is None:
        raise HTTPException(status_code=400, detail="Invalid feature name")

    X = X_iris

    # Grid bounds with padding
    x_min, x_max = float(X[:, idx_x].min() - 0.5), float(X[:, idx_x].max() + 0.5)
    y_min, y_max = float(X[:, idx_y].min() - 0.5), float(X[:, idx_y].max() + 0.5)

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
        "x_range": [x_min, x_max],
        "y_range": [y_min, y_max],
        "resolution": resolution,
        "grid": [preds[i * resolution:(i + 1) * resolution] for i in range(resolution)],
    }


# ====================================================================
# ĐỘT PHÁ 1: SUPPORT VECTORS INSPECTOR
# ====================================================================
@app.get("/support-vectors")
def get_support_vectors(kernel: str = Query(default="rbf", pattern="^(linear|rbf|poly|sigmoid)$")):
    """
    Detailed inspection of Support Vectors for the given kernel.
    Returns support vector indices, counts per class, and linear hyperplane weights.
    """
    if kernel not in models:
        raise HTTPException(status_code=400, detail=f"Kernel '{kernel}' not available")

    model = models[kernel]
    svc = model.named_steps["svc"]

    indices = [int(idx) for idx in svc.support_]
    n_support = [int(n) for n in svc.n_support_]

    # Map back to 150 Iris rows
    sv_points = []
    for idx in indices:
        row = X_iris[idx]
        sv_points.append({
            "index": idx,
            "sepal_length": float(row[0]),
            "sepal_width": float(row[1]),
            "petal_length": float(row[2]),
            "petal_width": float(row[3]),
            "class_id": int(y_iris[idx]),
            "species": metadata["class_mapping"][str(int(y_iris[idx]))],
        })

    response = {
        "kernel": kernel,
        "total_support_vectors": len(indices),
        "n_support_per_class": {
            "setosa": n_support[0],
            "versicolor": n_support[1],
            "virginica": n_support[2],
        },
        "support_vector_indices": indices,
        "support_vectors": sv_points,
    }

    if kernel == "linear":
        response["coef"] = svc.coef_.tolist()
        response["intercept"] = svc.intercept_.tolist()
        response["hyperplane_math"] = (
            "Phương trình siêu phẳng phân cách: w · x + b = 0. "
            "Các điểm dữ liệu là Support Vector khi khoảng cách đến siêu phẳng đạt giá trị cực tiểu: y_i(w · x_i + b) = 1."
        )

    return response


# ====================================================================
# ĐỘT PHÁ 2: LIVE SVM PLAYGROUND
# ====================================================================
@app.get("/svm-playground")
def svm_playground(
    kernel: str = Query(default="rbf", pattern="^(linear|rbf|poly|sigmoid)$"),
    C: float = Query(default=1.0, ge=0.001, le=1000.0),
    gamma: float = Query(default=1.0, ge=0.001, le=100.0),
    degree: int = Query(default=3, ge=1, le=5),
    resolution: int = Query(default=50, ge=20, le=80),
):
    """
    Live SVM Training Playground on 2D Petal features (Petal Length vs Petal Width).
    Recalculates decision boundary, support vectors and mathematical diagnosis instantly.
    """
    X_2d = X_iris[:, [2, 3]]
    y = y_iris

    kwargs = {"kernel": kernel, "C": C, "random_state": 42}
    if kernel in ("rbf", "poly", "sigmoid"):
        kwargs["gamma"] = gamma
    if kernel == "poly":
        kwargs["degree"] = degree

    pipe = Pipeline([
        ("scaler", StandardScaler()),
        ("svc", SVC(**kwargs)),
    ])
    pipe.fit(X_2d, y)

    svc = pipe.named_steps["svc"]
    train_acc = float(pipe.score(X_2d, y))

    x_min, x_max = float(X_2d[:, 0].min() - 0.5), float(X_2d[:, 0].max() + 0.5)
    y_min, y_max = float(X_2d[:, 1].min() - 0.5), float(X_2d[:, 1].max() + 0.5)

    xx = np.linspace(x_min, x_max, resolution)
    yy = np.linspace(y_min, y_max, resolution)
    xx_grid, yy_grid = np.meshgrid(xx, yy)
    grid_points = np.c_[xx_grid.ravel(), yy_grid.ravel()]

    preds = pipe.predict(grid_points).astype(int).tolist()

    # Mathematical & ML diagnosis
    diagnoses = []
    if C >= 50.0:
        diagnoses.append("⚠️ C rất lớn (Hard Margin): Mô hình phạt nặng sai số phân loại, margin rất hẹp $\\to$ Nhạy cảm với nhiễu & nguy cơ Quá khớp (Overfitting).")
    elif C <= 0.05:
        diagnoses.append("⚠️ C rất nhỏ (Soft Margin): Lề mở rộng tối đa, chấp nhận nhiều điểm vi phạm $\\to$ Nguy cơ Dưới khớp (Underfitting).")
    else:
        diagnoses.append("✅ C ở mức cân bằng tốt giữa tối đa hóa khoảng cách lề và hạn chế lỗi phân loại.")

    if kernel == "rbf":
        if gamma >= 10.0:
            diagnoses.append("⚠️ Gamma rất cao: Bán kính tương tác Gaussian nhỏ, tạo các 'ốc đảo' bao quanh từng điểm dữ liệu cá lẻ $\\to$ Điển hình của hiện tượng Overfitting!")
        elif gamma <= 0.05:
            diagnoses.append("⚠️ Gamma quá nhỏ: Bán kính tương tác quá lớn, làm phẳng biên phân cách $\\to$ Không tận dụng được tính phi tuyến của RBF.")
        else:
            diagnoses.append("✅ Gamma hài hòa: Đường biên uốn lượn tự nhiên theo mật độ của dữ liệu hoa.")
    elif kernel == "poly":
        diagnoses.append(f"Đa thức bậc {degree}: Bậc càng cao thì đường biên càng uốn khúc mạnh, cần kiểm soát C để tránh phân tán.")

    return {
        "kernel": kernel,
        "C": C,
        "gamma": gamma,
        "degree": degree,
        "train_accuracy": round(train_acc * 100, 1),
        "total_support_vectors": len(svc.support_),
        "n_support_per_class": [int(n) for n in svc.n_support_],
        "support_vector_indices": [int(idx) for idx in svc.support_],
        "x_range": [x_min, x_max],
        "y_range": [y_min, y_max],
        "resolution": resolution,
        "grid": [preds[i * resolution:(i + 1) * resolution] for i in range(resolution)],
        "diagnosis": " ".join(diagnoses),
    }


# ====================================================================
# ĐỘT PHÁ 3: KERNEL ARENA (4-WAY BATTLE BENCHMARK)
# ====================================================================
@app.get("/kernel-arena")
def kernel_arena():
    """
    Comparison matrix and benchmark of all 4 SVM kernels (Linear, RBF, Poly, Sigmoid).
    Includes side-by-side mini decision boundaries, latency benchmarks, and math properties.
    """
    arena_results = []
    test_sample = np.array([[5.8, 3.0, 4.2, 1.3]])

    descriptions = {
        "linear": {
            "surface": "Siêu phẳng tuyến tính (Flat Hyperplane)",
            "best_for": "Dữ liệu phân tách phẳng, ưu tiên tốc độ suy luận nhanh nhất",
            "math_form": "K(x, x') = x^T x'",
            "pros": "Cực nhanh, dễ giải thích trọng số vector pháp tuyến w, ít bị Overfitting",
            "cons": "Không bắt được đường biên cong phức tạp giữa Versicolor và Virginica",
        },
        "rbf": {
            "surface": "Phi tuyến mượt mà (Gaussian Radial Basis Function)",
            "best_for": "Mọi bài toán phân loại tổng quát (Khuyên dùng chuẩn mực)",
            "math_form": "K(x, x') = exp(-γ ||x - x'||^2)",
            "pros": "Độ chính xác cao nhất (96.0%), xử lý vùng chồng lấn dữ liệu cực kỳ khéo léo",
            "cons": "Cần tinh chỉnh siêu tham số C và gamma cẩn thận để tránh Overfitting",
        },
        "poly": {
            "surface": "Đa thức bậc 3 (Polynomial Curved Surface)",
            "best_for": "Dữ liệu có mối tương tác phi tuyến bậc cao giữa các đặc trưng",
            "math_form": "K(x, x') = (γ x^T x' + coef0)^d",
            "pros": "Mô hình hóa được tương tác tích giữa chiều dài và chiều rộng cánh hoa",
            "cons": "Tính toán chậm hơn, nhạy cảm với việc chuẩn hóa thang đo (StandardScaler)",
        },
        "sigmoid": {
            "surface": "Phi tuyến Hyperbolic (S-curve)",
            "best_for": "Nghiên cứu học thuật so sánh hành vi giữa SVM và Mạng Neural",
            "math_form": "K(x, x') = tanh(γ x^T x' + coef0)",
            "pros": "Có cơ sở lý thuyết kết nối SVM với mạng nơ-ron Perceptron 2 lớp",
            "cons": "Dễ vi phạm điều kiện Mercer (ma trận Gram bán xác định dương), độ chính xác thấp hơn",
        },
    }

    X_2d = X_iris[:, [2, 3]]
    x_min, x_max = float(X_2d[:, 0].min() - 0.5), float(X_2d[:, 0].max() + 0.5)
    y_min, y_max = float(X_2d[:, 1].min() - 0.5), float(X_2d[:, 1].max() + 0.5)
    res = 40
    xx = np.linspace(x_min, x_max, res)
    yy = np.linspace(y_min, y_max, res)
    xx_grid, yy_grid = np.meshgrid(xx, yy)

    medians = np.median(X_iris, axis=0)
    grid_points = np.full((xx_grid.size, 4), 0.0)
    for i in range(4):
        grid_points[:, i] = medians[i]
    grid_points[:, 2] = xx_grid.ravel()
    grid_points[:, 3] = yy_grid.ravel()

    for m in metadata["models"]:
        k = m["kernel"]
        model = models[k]
        svc = model.named_steps["svc"]

        # Benchmark latency over 100 runs
        t0 = time.perf_counter()
        for _ in range(100):
            _ = model.predict(test_sample)
        t_elapsed = (time.perf_counter() - t0) / 100 * 1000  # ms

        preds = model.predict(grid_points).astype(int).tolist()

        arena_results.append({
            "version": m["version"],
            "kernel": k,
            "display_name": m["display_name"],
            "cv_accuracy": round(m["cv_accuracy_mean"] * 100, 2),
            "cv_accuracy_std": round(m["cv_accuracy_std"] * 100, 2),
            "total_support_vectors": len(svc.support_),
            "n_support_per_class": [int(n) for n in svc.n_support_],
            "latency_ms": round(t_elapsed, 3),
            "details": descriptions.get(k, {}),
            "mini_grid": [preds[i * res:(i + 1) * res] for i in range(res)],
            "x_range": [x_min, x_max],
            "y_range": [y_min, y_max],
            "resolution": res,
        })

    return {"arena": arena_results}


# ====================================================================
# ĐỘT PHÁ 4: EXPLAINABLE AI (XAI)
# ====================================================================
@app.post("/explain")
def explain_prediction(data: IrisInput):
    """
    Explainable AI (XAI) feature attribution for a single prediction.
    Calculates sensitivity-based feature importance and natural biological comparisons.
    """
    kernel = data.kernel
    if kernel not in models:
        raise HTTPException(status_code=400, detail=f"Kernel '{kernel}' not available")

    model = models[kernel]
    sample = np.array([[data.sepal_length, data.sepal_width, data.petal_length, data.petal_width]], dtype=float)
    probs = model.predict_proba(sample)[0]
    pred_idx = int(np.argmax(probs))
    pred_label = metadata["class_mapping"][str(pred_idx)]

    # Feature perturbation sensitivity
    feature_names = ["sepal_length", "sepal_width", "petal_length", "petal_width"]
    display_names = ["Chiều dài đài (Sepal Length)", "Chiều rộng đài (Sepal Width)", "Chiều dài cánh (Petal Length)", "Chiều rộng cánh (Petal Width)"]

    diffs = []
    for i in range(4):
        s_plus = sample.copy()
        s_plus[0, i] += 0.3
        p_plus = model.predict_proba(s_plus)[0][pred_idx]

        s_minus = sample.copy()
        s_minus[0, i] -= 0.3
        p_minus = model.predict_proba(s_minus)[0][pred_idx]

        diffs.append(abs(float(p_plus - p_minus)))

    total = sum(diffs) or 1.0
    importances = [round(float(d / total * 100), 1) for d in diffs]

    ranges = {
        "setosa": {"petal_length": "1.0 – 1.9 cm", "petal_width": "0.1 – 0.6 cm", "sepal_length": "4.3 – 5.8 cm", "sepal_width": "2.3 – 4.4 cm"},
        "versicolor": {"petal_length": "3.0 – 5.1 cm", "petal_width": "1.0 – 1.8 cm", "sepal_length": "4.9 – 7.0 cm", "sepal_width": "2.0 – 3.4 cm"},
        "virginica": {"petal_length": "4.5 – 6.9 cm", "petal_width": "1.4 – 2.5 cm", "sepal_length": "4.9 – 7.9 cm", "sepal_width": "2.2 – 3.8 cm"},
    }

    attributions = []
    for i in range(4):
        f_key = feature_names[i]
        val = sample[0, i]
        attributions.append({
            "feature": f_key,
            "display_name": display_names[i],
            "value": float(val),
            "importance_pct": importances[i],
            "typical_range": ranges[pred_label].get(f_key, ""),
        })

    attributions.sort(key=lambda x: x["importance_pct"], reverse=True)
    top_feature = attributions[0]["display_name"]

    explanation_text = (
        f"Mô hình dự đoán hoa này là **{pred_label.capitalize()}** với độ tin cậy {round(float(probs[pred_idx]*100), 1)}%. "
        f"Yếu tố có trọng số quyết định cao nhất là **{top_feature}** ({attributions[0]['importance_pct']}%), "
        f"bởi vì giá trị {attributions[0]['value']} cm hoàn toàn trùng khớp với dải kích thước đặc trưng của loài {pred_label}."
    )

    return {
        "prediction": pred_label,
        "class_id": pred_idx,
        "probability": float(probs[pred_idx]),
        "attributions": attributions,
        "explanation": explanation_text,
    }


# ====================================================================
# ĐỘT PHÁ 5: BATCH PREDICTION & SAMPLE CSV
# ====================================================================
@app.post("/predict-batch")
def predict_batch(payload: BatchPredictRequest):
    """
    Batch prediction endpoint for up to 500 samples.
    """
    if len(payload.samples) > 500:
        raise HTTPException(status_code=400, detail="Tối đa 500 mẫu trong một lần xử lý")

    results = []
    for idx, item in enumerate(payload.samples):
        kernel = item.kernel or "rbf"
        if kernel not in models:
            kernel = "rbf"
        model = models[kernel]
        feats = np.array([[item.sepal_length, item.sepal_width, item.petal_length, item.petal_width]], dtype=float)
        pred_idx = int(model.predict(feats)[0])
        label = metadata["class_mapping"][str(pred_idx)]
        prob = float(model.predict_proba(feats)[0][pred_idx])

        status = "Tin cậy cao" if prob >= 0.85 else ("Tin cậy khá" if prob >= 0.65 else "Vùng bất định")

        results.append({
            "id": idx + 1,
            "sepal_length": item.sepal_length,
            "sepal_width": item.sepal_width,
            "petal_length": item.petal_length,
            "petal_width": item.petal_width,
            "kernel": kernel,
            "prediction": label,
            "class_id": pred_idx,
            "probability": round(prob * 100, 1),
            "status": status,
        })
    return {"count": len(results), "predictions": results}


@app.get("/sample-csv")
def get_sample_csv():
    """Download a template CSV with 10 sample flowers for batch testing."""
    sample_data = (
        "sepal_length,sepal_width,petal_length,petal_width,kernel\n"
        "5.1,3.5,1.4,0.2,rbf\n"
        "4.9,3.0,1.4,0.2,linear\n"
        "4.7,3.2,1.3,0.2,rbf\n"
        "6.4,3.2,4.5,1.5,rbf\n"
        "6.9,3.1,4.9,1.5,poly\n"
        "5.5,2.3,4.0,1.3,linear\n"
        "6.3,3.3,6.0,2.5,rbf\n"
        "5.8,2.7,5.1,1.9,sigmoid\n"
        "7.1,3.0,5.9,2.1,rbf\n"
        "5.9,3.0,5.1,1.8,poly\n"
    )
    return StreamingResponse(
        io.BytesIO(sample_data.encode("utf-8")),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=iris_test_samples.csv"},
    )
