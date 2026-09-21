from fastapi.testclient import TestClient
from app.main import app, metadata

client = TestClient(app)

def test_health():
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["model_loaded"] is True
    assert "model_version" in r.json()

def test_predict_rejects_missing_features():
    # Cố tình gửi sai 1 feature
    r = client.post("/predict", json={"features": {"mean radius": 10.0}})
    assert r.status_code == 422
    
def test_metadata_has_30_features():
    r = client.get("/metadata")
    assert r.status_code == 200
    assert len(r.json()["feature_names"]) == 30
    
def test_predict_happy_path():
    # Gửi thử 30 feature hợp lệ
    # Lấy feature names trực tiếp từ metadata để tạo dummy request nhanh nhất
    expected_features = metadata["feature_names"]
    dummy_payload = {name: 1.0 for name in expected_features}
    
    r = client.post("/predict", json={"features": dummy_payload})
    assert r.status_code == 200
    
    res = r.json()
    assert "predicted_class" in res
    assert "predicted_label" in res
    assert "probability_malignant" in res
    assert "probability_benign" in res
