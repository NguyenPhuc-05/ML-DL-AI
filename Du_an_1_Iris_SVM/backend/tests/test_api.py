from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_health_reports_loaded_model():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["model_loaded"] is True
    assert "rbf" in data["models_loaded"]
    assert "linear" in data["models_loaded"]


def test_metadata_describes_multikernel_models():
    response = client.get("/metadata")
    assert response.status_code == 200
    body = response.json()
    assert len(body["models"]) == 4
    kernels = [m["kernel"] for m in body["models"]]
    assert set(kernels) == {"linear", "rbf", "poly", "sigmoid"}
    assert len(body["feature_names"]) == 4


def test_models_endpoint():
    response = client.get("/models")
    assert response.status_code == 200
    body = response.json()
    assert "default_kernel" in body
    assert len(body["models"]) == 4


def test_predict_setosa_sample():
    response = client.post(
        "/predict",
        json={
            "sepal_length": 5.1,
            "sepal_width": 3.5,
            "petal_length": 1.4,
            "petal_width": 0.2,
            "kernel": "rbf",
        },
    )
    assert response.status_code == 200
    assert response.json()["class_id"] == 0
    assert response.json()["prediction"] == "setosa"
    assert response.json()["kernel"] == "rbf"


def test_predict_all_kernels():
    for kernel in ["linear", "rbf", "poly", "sigmoid"]:
        response = client.post(
            "/predict",
            json={
                "sepal_length": 6.0,
                "sepal_width": 3.0,
                "petal_length": 4.5,
                "petal_width": 1.5,
                "kernel": kernel,
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["kernel"] == kernel
        assert data["prediction"] in ["setosa", "versicolor", "virginica"]
        assert 0.0 <= data["probability"] <= 1.0


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


def test_decision_boundary():
    response = client.get("/decision-boundary?kernel=linear&resolution=30")
    assert response.status_code == 200
    data = response.json()
    assert data["kernel"] == "linear"
    assert len(data["grid"]) == 30


def test_predictions_history_and_export():
    # Make a prediction to ensure history has items
    client.post(
        "/predict",
        json={
            "sepal_length": 5.0,
            "sepal_width": 3.4,
            "petal_length": 1.5,
            "petal_width": 0.2,
            "kernel": "linear",
        },
    )
    # Check history
    res = client.get("/predictions?limit=10")
    assert res.status_code == 200
    assert len(res.json()) > 0

    # Check export excel
    export_res = client.get("/predictions/export")
    assert export_res.status_code == 200
    assert "spreadsheetml" in export_res.headers.get("content-type", "")
