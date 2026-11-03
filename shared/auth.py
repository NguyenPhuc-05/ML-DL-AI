import os
from typing import Optional

import jwt
from fastapi import HTTPException, Security, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

# HTTP Bearer scheme with auto_error=False to allow clean 401 exceptions
security = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Security(security),
) -> dict:
    """
    FastAPI dependency that verifies Bearer JWT locally for the calling service.
    Validates signature via JWT_SECRET and audience matching CLIENT_ID.
    Returns: dict {"id": str, "email": str, "aud": str}
    """
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Yêu cầu đăng nhập (Missing Authorization header)",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials
    jwt_secret = os.getenv("JWT_SECRET", "identity_service_secret_key")
    expected_client_id = os.getenv("CLIENT_ID", "iris-svm-api")

    try:
        payload = jwt.decode(
            token,
            jwt_secret,
            algorithms=["HS256"],
            audience=expected_client_id,
        )
        user_id = payload.get("sub")
        email = payload.get("email")

        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token không hợp lệ (Missing subject claim)",
                headers={"WWW-Authenticate": "Bearer"},
            )

        return {
            "id": str(user_id),
            "email": email,
            "aud": payload.get("aud"),
        }

    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Phiên làm việc đã hết hạn (Token expired)",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.InvalidAudienceError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token không dành cho dịch vụ này (Audience mismatch: expected '{expected_client_id}')",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.PyJWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token không hợp lệ ({str(e)})",
            headers={"WWW-Authenticate": "Bearer"},
        )

