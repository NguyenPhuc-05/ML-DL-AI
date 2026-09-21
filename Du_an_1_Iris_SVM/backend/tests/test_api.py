from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_health_reports_loaded_model():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["model_loaded"] is True


def test_metadata_describes_linear_model():
    response = client.get("/metadata")
    assert response.status_code == 200
    body = response.json()
    assert body["kernel"] == "linear"
    assert len(body["feature_names"]) == 4


def test_predict_setosa_sample():
    response = client.post(
        "/predict",
        json={
            "sepal_length": 5.1,
            "sepal_width": 3.5,
            "petal_length": 1.4,
            "petal_width": 0.2,
        },
    )
    assert response.status_code == 200
    assert response.json()["class_id"] == 0
    assert response.json()["prediction"] == "setosa"


def test_predict_rejects_missing_field():
    response = client.post(
        "/predict",
        json={
            "sepal_length": 5.1,
            "sepal_width": 3.5,
            "petal_length": 1.4,
        },
    )
    assert response.status_code == 422


def test_predict_rejects_out_of_range_value():
    response = client.post(
        "/predict",
        json={
            "sepal_length": 99,
            "sepal_width": 3.5,
            "petal_length": 1.4,
            "petal_width": 0.2,
        },
    )
    assert response.status_code == 422

