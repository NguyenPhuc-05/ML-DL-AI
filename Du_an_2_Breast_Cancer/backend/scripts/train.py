import sys
sys.stdout.reconfigure(encoding='utf-8')

import json
import joblib
import sklearn
import numpy as np
from pathlib import Path

from sklearn.datasets import load_breast_cancer
from sklearn.model_selection import train_test_split, StratifiedKFold, GridSearchCV
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.svm import SVC
from sklearn.metrics import (
    classification_report, 
    confusion_matrix,
    recall_score, 
    precision_score, 
    roc_auc_score
)

def main():
    print("--- 1. NẠP DỮ LIỆU ---")
    bundle = load_breast_cancer(as_frame=True)
    X = bundle.data
    y = bundle.target
    
    print(f"X shape: {X.shape}")
    print(f"y value counts:\n{y.value_counts()}")
    print(f"Target names: {bundle.target_names}")
    
    print("\n--- 2. CHIA TẬP DỮ LIỆU (80/20) ---")
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, stratify=y, random_state=42
    )
    
    print("\n--- 3. KHỞI TẠO PIPELINE & GRID SEARCH ---")
    pipeline = Pipeline([
        ("scaler", StandardScaler()),
        ("svc", SVC(
            kernel="rbf",
            probability=True,
            class_weight="balanced",
            random_state=42
        ))
    ])
    
    param_grid = {
        "svc__C": [0.1, 1, 10, 100],
        "svc__gamma": ["scale", 0.001, 0.01, 0.1]
    }
    
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    search = GridSearchCV(
        estimator=pipeline,
        param_grid=param_grid,
        scoring="recall_macro",
        cv=cv,
        n_jobs=-1,
        refit=True
    )
    
    print("Đang huấn luyện và tối ưu siêu tham số... (vui lòng chờ)")
    search.fit(X_train, y_train)
    
    model = search.best_estimator_
    print(f"Siêu tham số tốt nhất: {search.best_params_}")
    
    print("\n--- 4. ĐÁNH GIÁ TRÊN TẬP KIỂM TRA (TEST 20%) ---")
    pred = model.predict(X_test)
    proba_malignant = model.predict_proba(X_test)[:, 0]
    
    print("Confusion Matrix:")
    print(confusion_matrix(y_test, pred, labels=[0, 1]))
    
    print("\nClassification Report:")
    print(classification_report(
        y_test, pred, 
        labels=[0, 1], 
        target_names=["malignant", "benign"]
    ))
    
    print(f"Sensitivity (Recall malignant): {recall_score(y_test, pred, pos_label=0):.4f}")
    print(f"Precision malignant: {precision_score(y_test, pred, pos_label=0):.4f}")
    
    # Tính ROC-AUC cho lớp malignant. 
    # Do malignant là 0, ta cần đảo nhãn thành 1 để tính AUC đúng chiều
    y_test_malignant = (y_test == 0).astype(int)
    print(f"ROC-AUC malignant: {roc_auc_score(y_test_malignant, proba_malignant):.4f}")
    
    print("\n--- 5. XUẤT MÔ HÌNH VÀ METADATA ---")
    # Sử dụng đường dẫn tương đối so với thư mục gốc của backend service
    # Khi chạy từ backend/, folder artifacts sẽ được tạo tại backend/artifacts/
    ARTIFACT_DIR = Path("artifacts")
    ARTIFACT_DIR.mkdir(exist_ok=True, parents=True)
    
    # Lưu mô hình joblib
    joblib_path = ARTIFACT_DIR / "breast_cancer_svm.joblib"
    joblib.dump(model, joblib_path)
    print(f"Đã lưu mô hình tại: {joblib_path}")
    
    # Lưu metadata
    metadata = {
        "model_name": "breast-cancer-svm-rbf",
        "model_version": "1.0.0",
        "feature_names": list(X.columns),
        "class_mapping": {"0": "malignant", "1": "benign"},
        "best_params": search.best_params_,
        "sklearn_version": sklearn.__version__,
        "warning": "Educational use only; not a medical diagnosis."
    }
    
    meta_path = ARTIFACT_DIR / "metadata.json"
    meta_path.write_text(
        json.dumps(metadata, ensure_ascii=False, indent=2),
        encoding="utf-8"
    )
    print(f"Đã lưu metadata tại: {meta_path}")
    print("HOÀN TẤT HUẤN LUYỆN!")

if __name__ == "__main__":
    main()
