import os

# Set environment variables with a 32+ char JWT_SECRET and required configs before any app import
os.environ["JWT_SECRET"] = "iris-test-jwt-secret-key-32bytes!!"
os.environ["CLIENT_ID"] = "iris-svm-api"
os.environ["DATABASE_URL"] = "sqlite:///./test_iris.db"
