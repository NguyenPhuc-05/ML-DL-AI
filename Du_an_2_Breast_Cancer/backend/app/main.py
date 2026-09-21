from pathlib import Path
import json
import joblib
import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# --- Cấu hình đường dẫn ---
BASE_DIR = Path(__file__).resolve().parents[1]
MODEL_PATH = BASE_DIR / "artifacts/breast_cancer_svm.joblib"
META_PATH = BASE_DIR / "artifacts/metadata.json"

# --- Nạp Artifacts ---
# Nếu file không tồn tại, app sẽ báo lỗi ngay lúc khởi động (đúng thiết kế Fail-fast)
model = joblib.load(MODEL_PATH)
metadata = json.loads(META_PATH.read_text(encoding="utf-8"))

# --- Khởi tạo FastAPI ---
app = FastAPI(
    title="Breast Cancer SVM API",
    version=metadata["model_version"],
    description="Educational demonstration only"
)

# --- CORS Middleware ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Trong thực tế nên giới hạn domain của Frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Pydantic Models ---
class PredictionRequest(BaseModel):
    features: dict[str, float] = Field(
        ...,
        description="Exactly 30 named numeric features"
    )

class PredictionResponse(BaseModel):
    predicted_class: int
    predicted_label: str
    probability_malignant: float
    probability_benign: float
    model_version: str
    warning: str

# --- Hàm hỗ trợ ---
def build_vector(payload: PredictionRequest) -> np.ndarray:
    expected = metadata["feature_names"]
    received = set(payload.features.keys())
    
    missing = sorted(set(expected) - received)
    extra = sorted(received - set(expected))
    
    if missing or extra:
        raise HTTPException(
            status_code=422,
            detail={"missing": missing, "extra": extra}
        )
        
    # Tạo mảng numpy theo đúng thứ tự của expected (metadata["feature_names"])
    values = np.array(
        [[payload.features[name] for name in expected]],
        dtype=float
    )
    
    if not np.isfinite(values).all():
        raise HTTPException(status_code=422, detail="Features must be finite numbers")
        
    return values

# --- API Endpoints ---
@app.get("/")
def root():
    return {
        "service": "Breast Cancer SVM API",
        "docs": "/docs",
        "warning": metadata["warning"]
    }

@app.get("/health")
def health():
    return {
        "status": "ok",
        "model_loaded": model is not None,
        "model_version": metadata["model_version"]
    }

@app.get("/metadata")
def get_metadata():
    return metadata

@app.post("/predict", response_model=PredictionResponse)
def predict(payload: PredictionRequest):
    # 1. Chuyển đổi và kiểm tra vector đầu vào
    x = build_vector(payload)
    
    # 2. Dự đoán
    predicted_class = int(model.predict(x)[0])
    probabilities = model.predict_proba(x)[0]
    
    # 3. Ánh xạ xác suất với nhãn lớp (giải quyết an toàn hơn cách trong slide một chút)
    classes = list(model.named_steps["svc"].classes_)
    p = {int(c): float(v) for c, v in zip(classes, probabilities)}
    
    # Lấy class_mapping từ metadata
    class_mapping = metadata["class_mapping"]
    
    # 4. Trả về kết quả
    return PredictionResponse(
        predicted_class=predicted_class,
        predicted_label=class_mapping[str(predicted_class)],
        probability_malignant=p.get(0, 0.0), # 0 là Malignant
        probability_benign=p.get(1, 0.0),    # 1 là Benign
        model_version=metadata["model_version"],
        warning=metadata["warning"]
    )
