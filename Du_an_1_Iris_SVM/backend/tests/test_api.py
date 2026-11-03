import os
from datetime import datetime, timedelta, timezone

import jwt
import pytest
from fastapi.testclient import TestClient

# Configure test environment
os.environ["DATABASE_URL"] = "sqlite:///./test_iris.db"
os.environ["JWT_SECRET"] = "iris-test-jwt-secret-key-32bytes!!"
os.environ["CLIENT_ID"] = "iris-svm-api"

from app.main import app
from shared.auth import get_current_user


@pytest.fixture(autouse=True)
def default_auth_override():
    """Maintain backward compatibility for existing 14 tests by overriding auth dependency."""
    app.dependency_overrides[get_current_user] = lambda: {
        "id": "test-user-default",
        "email": "student@iris.ai",
        "aud": "iris-svm-api",
    }
    yield
    app.dependency_overrides.clear()


client = TestClient(app)


# ==============================================================================
# EXISTING 14 TESTS (PRESERVED & PASSING)
# ==============================================================================

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


def test_support_vectors_endpoint():
    for kernel in ["linear", "rbf"]:
        res = client.get(f"/support-vectors?kernel={kernel}")
        assert res.status_code == 200
        data = res.json()
        assert data["total_support_vectors"] > 0
        assert "setosa" in data["n_support_per_class"]
        assert len(data["support_vectors"]) == data["total_support_vectors"]
        if kernel == "linear":
            assert "coef" in data
            assert "intercept" in data


def test_svm_playground_endpoint():
    res = client.get("/svm-playground?kernel=rbf&C=10.0&gamma=0.5&resolution=25")
    assert res.status_code == 200
    data = res.json()
    assert data["train_accuracy"] > 80.0
    assert data["total_support_vectors"] > 0
    assert len(data["grid"]) == 25
    assert "diagnosis" in data


def test_kernel_arena_endpoint():
    res = client.get("/kernel-arena")
    assert res.status_code == 200
    arena = res.json()["arena"]
    assert len(arena) == 4
    kernels = [x["kernel"] for x in arena]
    assert set(kernels) == {"linear", "rbf", "poly", "sigmoid"}
    for item in arena:
        assert item["latency_ms"] >= 0
        assert len(item["mini_grid"]) == item["resolution"]


def test_explain_endpoint():
    res = client.post(
        "/explain",
        json={
            "sepal_length": 5.1,
            "sepal_width": 3.5,
            "petal_length": 1.4,
            "petal_width": 0.2,
            "kernel": "rbf",
        },
    )
    assert res.status_code == 200
    data = res.json()
    assert data["prediction"] == "setosa"
    assert len(data["attributions"]) == 4
    assert "explanation" in data


def test_batch_prediction_and_sample_csv():
    # Test batch prediction
    res = client.post(
        "/predict-batch",
        json={
            "samples": [
                {"sepal_length": 5.1, "sepal_width": 3.5, "petal_length": 1.4, "petal_width": 0.2, "kernel": "linear"},
                {"sepal_length": 6.7, "sepal_width": 3.1, "petal_length": 4.7, "petal_width": 1.5, "kernel": "rbf"},
            ]
        },
    )
    assert res.status_code == 200
    data = res.json()
    assert data["count"] == 2
    assert len(data["predictions"]) == 2

    # Test sample CSV download
    csv_res = client.get("/sample-csv")
    assert csv_res.status_code == 200
    assert "text/csv" in csv_res.headers.get("content-type", "")
    assert "sepal_length" in csv_res.text


def test_predictions_history_and_export():
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
    res = client.get("/predictions?limit=10")
    assert res.status_code == 200
    assert len(res.json()) > 0

    export_res = client.get("/predictions/export")
    assert export_res.status_code == 200
    assert "spreadsheetml" in export_res.headers.get("content-type", "")


# ==============================================================================
# NEW AUTHENTICATION & CENTRALIZED IDP INTEGRATION TESTS
# ==============================================================================

def test_unauthenticated_endpoints_return_401():
    """Verify protected endpoints reject requests when no Authorization header is provided."""
    app.dependency_overrides.clear()  # Remove mock override

    endpoints = [
        ("POST", "/predict", {"sepal_length": 5.1, "sepal_width": 3.5, "petal_length": 1.4, "petal_width": 0.2, "kernel": "rbf"}),
        ("POST", "/predict-batch", {"samples": [{"sepal_length": 5.1, "sepal_width": 3.5, "petal_length": 1.4, "petal_width": 0.2, "kernel": "rbf"}]}),
        ("POST", "/explain", {"sepal_length": 5.1, "sepal_width": 3.5, "petal_length": 1.4, "petal_width": 0.2, "kernel": "rbf"}),
        ("GET", "/predictions", None),
        ("GET", "/predictions/export", None),
        ("DELETE", "/predictions", None),
    ]

    for method, path, body in endpoints:
        if method == "POST":
            res = client.post(path, json=body)
        elif method == "GET":
            res = client.get(path)
        elif method == "DELETE":
            res = client.delete(path)
        assert res.status_code == 401, f"{method} {path} should return 401 when unauthenticated, got {res.status_code}"


def test_wrong_audience_token_rejected_with_401():
    """Verify that a valid JWT token intended for another client (wrong aud) is rejected."""
    app.dependency_overrides.clear()

    wrong_aud_token = jwt.encode(
        {
            "sub": "user-999",
            "email": "user@breast-cancer.ai",
            "aud": "breast-cancer-api",  # Wrong audience for iris-svm-api
            "exp": datetime.now(timezone.utc) + timedelta(minutes=60),
        },
        os.environ["JWT_SECRET"],
        algorithm="HS256",
    )

    res = client.post(
        "/predict",
        headers={"Authorization": f"Bearer {wrong_aud_token}"},
        json={"sepal_length": 5.1, "sepal_width": 3.5, "petal_length": 1.4, "petal_width": 0.2, "kernel": "rbf"},
    )
    assert res.status_code == 401
    assert "Audience mismatch" in res.json()["detail"]


def test_valid_token_authenticates_successfully():
    """Verify that a correctly signed JWT with aud=iris-svm-api succeeds without overrides."""
    app.dependency_overrides.clear()

    valid_token = jwt.encode(
        {
            "sub": "user-888",
            "email": "valid-student@iris.ai",
            "aud": "iris-svm-api",
            "exp": datetime.now(timezone.utc) + timedelta(minutes=60),
        },
        os.environ["JWT_SECRET"],
        algorithm="HS256",
    )

    res = client.post(
        "/predict",
        headers={"Authorization": f"Bearer {valid_token}"},
        json={"sepal_length": 5.1, "sepal_width": 3.5, "petal_length": 1.4, "petal_width": 0.2, "kernel": "rbf"},
    )
    assert res.status_code == 200
    assert res.json()["prediction"] == "setosa"


def test_per_user_history_isolation():
    """Verify user prediction history is completely isolated between users."""
    app.dependency_overrides.clear()

    user_a_token = jwt.encode(
        {"sub": "user-A", "email": "a@iris.ai", "aud": "iris-svm-api", "exp": datetime.now(timezone.utc) + timedelta(minutes=60)},
        os.environ["JWT_SECRET"],
        algorithm="HS256",
    )
    user_b_token = jwt.encode(
        {"sub": "user-B", "email": "b@iris.ai", "aud": "iris-svm-api", "exp": datetime.now(timezone.utc) + timedelta(minutes=60)},
        os.environ["JWT_SECRET"],
        algorithm="HS256",
    )

    # 1. Clear both histories first
    client.delete("/predictions", headers={"Authorization": f"Bearer {user_a_token}"})
    client.delete("/predictions", headers={"Authorization": f"Bearer {user_b_token}"})

    # 2. User A makes 1 prediction
    client.post(
        "/predict",
        headers={"Authorization": f"Bearer {user_a_token}"},
        json={"sepal_length": 5.1, "sepal_width": 3.5, "petal_length": 1.4, "petal_width": 0.2, "kernel": "rbf"},
    )

    # 3. User B makes 2 predictions
    for _ in range(2):
        client.post(
            "/predict",
            headers={"Authorization": f"Bearer {user_b_token}"},
            json={"sepal_length": 6.0, "sepal_width": 3.0, "petal_length": 4.5, "petal_width": 1.5, "kernel": "linear"},
        )

    # 4. Check User A only sees 1 prediction belonging to user A
    res_a = client.get("/predictions", headers={"Authorization": f"Bearer {user_a_token}"})
    assert res_a.status_code == 200
    records_a = res_a.json()
    assert len(records_a) == 1
    assert records_a[0]["username"] == "a@iris.ai"

    # 5. Check User B only sees 2 predictions belonging to user B
    res_b = client.get("/predictions", headers={"Authorization": f"Bearer {user_b_token}"})
    assert res_b.status_code == 200
    records_b = res_b.json()
    assert len(records_b) == 2
    for r in records_b:
        assert r["username"] == "b@iris.ai"

    # 6. User A deletes their history: User B history must remain intact!
    client.delete("/predictions", headers={"Authorization": f"Bearer {user_a_token}"})
    assert len(client.get("/predictions", headers={"Authorization": f"Bearer {user_a_token}"}).json()) == 0
    assert len(client.get("/predictions", headers={"Authorization": f"Bearer {user_b_token}"}).json()) == 2
