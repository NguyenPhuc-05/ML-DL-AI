import re

with open('Du_an_1_Iris_SVM/backend/app/main.py', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update PredictionRecord schema
old_schema = '''class PredictionRecord(BaseModel):
    id: int
    sepal_length: float
    sepal_width: float
    petal_length: float
    petal_width: float
    kernel: str
    prediction: str
    class_id: int
    probability: float
    model_version: str
    created_at: str'''

new_schema = '''class PredictionRecord(BaseModel):
    id: int
    username: str
    sepal_length: float
    sepal_width: float
    petal_length: float
    petal_width: float
    kernel: str
    prediction: str
    class_id: int
    probability: float
    model_version: str
    created_at: str'''

content = content.replace(old_schema, new_schema)

# 2. Update get_predictions endpoint
old_get = '''@app.get("/predictions", response_model=list[PredictionRecord])
def get_predictions(limit: int = Query(default=50, le=500), current_user: User = Depends(get_current_user)):
    """Get prediction history from database."""
    db = next(get_db_session())
    try:
        rows = db.query(DBPredictionRecord).filter(DBPredictionRecord.user_id == current_user.id).order_by(DBPredictionRecord.id.desc()).limit(limit).all()
        return [
            {
                "id": r.id, "sepal_length": r.sepal_length, "sepal_width": r.sepal_width,
                "petal_length": r.petal_length, "petal_width": r.petal_width,
                "kernel": r.kernel, "prediction": r.prediction, "class_id": r.class_id,
                "probability": r.probability, "model_version": r.model_version,
                "created_at": r.created_at
            }
            for r in rows
        ]
    finally:
        db.close()'''

new_get = '''from datetime import datetime, timezone, timedelta

@app.get("/predictions", response_model=list[PredictionRecord])
def get_predictions(limit: int = Query(default=50, le=500), current_user: User = Depends(get_current_user)):
    """Get prediction history from database for the last 5 hours globally."""
    db = next(get_db_session())
    try:
        five_hours_ago = (datetime.now(timezone.utc) - timedelta(hours=5)).isoformat()
        rows = db.query(DBPredictionRecord, User.username)\\
                 .join(User, DBPredictionRecord.user_id == User.id)\\
                 .filter(DBPredictionRecord.created_at >= five_hours_ago)\\
                 .order_by(DBPredictionRecord.id.desc())\\
                 .limit(limit)\\
                 .all()
        return [
            {
                "id": r[0].id, "username": r[1], "sepal_length": r[0].sepal_length, "sepal_width": r[0].sepal_width,
                "petal_length": r[0].petal_length, "petal_width": r[0].petal_width,
                "kernel": r[0].kernel, "prediction": r[0].prediction, "class_id": r[0].class_id,
                "probability": r[0].probability, "model_version": r[0].model_version,
                "created_at": r[0].created_at
            }
            for r in rows
        ]
    finally:
        db.close()'''

content = content.replace(old_get, new_get)

# 3. Update export_predictions to include username
old_export_query = '''rows = db.query(DBPredictionRecord).filter(DBPredictionRecord.user_id == current_user.id).order_by(DBPredictionRecord.id.desc()).all()'''
new_export_query = '''five_hours_ago = (datetime.now(timezone.utc) - timedelta(hours=5)).isoformat()
        rows = db.query(DBPredictionRecord, User.username)\\
                 .join(User, DBPredictionRecord.user_id == User.id)\\
                 .filter(DBPredictionRecord.created_at >= five_hours_ago)\\
                 .order_by(DBPredictionRecord.id.desc())\\
                 .all()'''

content = content.replace(old_export_query, new_export_query)

old_export_header = '''headers = ["ID", "Sepal Length", "Sepal Width", "Petal Length", "Petal Width", "Kernel", "Prediction", "Probability", "Date"]'''
new_export_header = '''headers = ["ID", "User", "Sepal Length", "Sepal Width", "Petal Length", "Petal Width", "Kernel", "Prediction", "Probability", "Date"]'''
content = content.replace(old_export_header, new_export_header)

old_export_append = '''ws.append([
            r.id, r.sepal_length, r.sepal_width, r.petal_length, r.petal_width,
            r.kernel, r.prediction, f"{r.probability:.2%}", r.created_at
        ])'''
new_export_append = '''ws.append([
            r[0].id, r[1], r[0].sepal_length, r[0].sepal_width, r[0].petal_length, r[0].petal_width,
            r[0].kernel, r[0].prediction, f"{r[0].probability:.2%}", r[0].created_at
        ])'''
content = content.replace(old_export_append, new_export_append)

# Note: I am NOT changing the clear_predictions endpoint, it will still only clear the CURRENT user's predictions, which is safe.

with open('Du_an_1_Iris_SVM/backend/app/main.py', 'w', encoding='utf-8') as f:
    f.write(content)

print("Backend patched")
