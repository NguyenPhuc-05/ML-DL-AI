import os
import pytest
from fastapi.testclient import TestClient

# Ensure test DB and secret
os.environ["DATABASE_URL"] = "sqlite:///./test_identity.db"
os.environ["JWT_SECRET"] = "test-jwt-secret-12345"
os.environ["CLIENT_IDS"] = "iris-svm-api,breast-cancer-api"

from app.main import app
from app.db import Base, engine
from app.models import init_db

@pytest.fixture(autouse=True)
def setup_test_db():
    Base.metadata.drop_all(bind=engine)
    init_db()
    yield
    Base.metadata.drop_all(bind=engine)
    if os.path.exists("./test_identity.db"):
        try:
            os.remove("./test_identity.db")
        except Exception:
            pass

client = TestClient(app)


def test_health():
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json() == {"status": "ok", "service": "identity-service"}


def test_register_and_login_success():
    # 1. Register
    reg_res = client.post(
        "/register",
        json={"email": "student@example.com", "password": "password123"},
    )
    assert reg_res.status_code == 201
    reg_data = reg_res.json()
    assert reg_data["email"] == "student@example.com"
    assert "id" in reg_data

    # 2. Login
    login_res = client.post(
        "/login",
        json={
            "email": "student@example.com",
            "password": "password123",
            "client_id": "iris-svm-api",
        },
    )
    assert login_res.status_code == 200
    login_data = login_res.json()
    assert "access_token" in login_data
    assert login_data["token_type"] == "bearer"
    assert login_data["user"]["email"] == "student@example.com"

    # 3. Test /me
    token = login_data["access_token"]
    me_res = client.get("/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    assert me_res.json()["email"] == "student@example.com"


def test_register_duplicate_email():
    client.post(
        "/register",
        json={"email": "student@example.com", "password": "password123"},
    )
    duplicate_res = client.post(
        "/register",
        json={"email": "student@example.com", "password": "other_password"},
    )
    assert duplicate_res.status_code == 400
    assert "Email đã được đăng ký" in duplicate_res.json()["detail"]


def test_login_wrong_password():
    client.post(
        "/register",
        json={"email": "student@example.com", "password": "password123"},
    )
    res = client.post(
        "/login",
        json={
            "email": "student@example.com",
            "password": "wrongpassword",
            "client_id": "iris-svm-api",
        },
    )
    assert res.status_code == 401
    assert "Sai email hoặc mật khẩu" in res.json()["detail"]


def test_login_unknown_client_id():
    client.post(
        "/register",
        json={"email": "student@example.com", "password": "password123"},
    )
    res = client.post(
        "/login",
        json={
            "email": "student@example.com",
            "password": "password123",
            "client_id": "unknown-service-api",
        },
    )
    assert res.status_code == 400
    assert "Unknown client_id" in res.json()["detail"]


def test_me_unauthorized():
    res = client.get("/me")
    assert res.status_code == 401

