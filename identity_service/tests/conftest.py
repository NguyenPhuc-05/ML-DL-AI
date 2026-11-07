import os

# Set environment variables with a 32+ char JWT_SECRET and required configs before any app import
os.environ["JWT_SECRET"] = "identity-test-jwt-secret-min32chars!!"
os.environ["CLIENT_ID"] = "iris-svm-api"
os.environ["CLIENT_IDS"] = "iris-svm-api,breast-cancer-api"
os.environ["OWNER_PASSWORD"] = "test-owner-password-12345"
os.environ["DATABASE_URL"] = "sqlite:///./test_identity.db"
os.environ["IDP_DATABASE_URL"] = "sqlite:///./test_identity.db"
