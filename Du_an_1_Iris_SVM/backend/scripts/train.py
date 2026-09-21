import json
from pathlib import Path

import joblib
import sklearn
from sklearn import datasets
from sklearn.model_selection import StratifiedKFold, cross_val_score
from sklearn.svm import SVC


BASE_DIR = Path(__file__).resolve().parents[1]
ARTIFACT_DIR = BASE_DIR / "artifacts"
MODEL_PATH = ARTIFACT_DIR / "iris_svm.joblib"
METADATA_PATH = ARTIFACT_DIR / "metadata.json"


def main() -> None:
    iris = datasets.load_iris()
    X = iris.data
    y = iris.target

    model = SVC(kernel="linear")
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    scores = cross_val_score(model, X, y, cv=cv, scoring="accuracy")

    model.fit(X, y)
    ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, MODEL_PATH)

    metadata = {
        "model_name": "iris-svm-linear",
        "model_version": "1.0.0",
        "feature_names": list(iris.feature_names),
        "class_mapping": {
            str(index): name for index, name in enumerate(iris.target_names)
        },
        "kernel": "linear",
        "cv_accuracy_mean": float(scores.mean()),
        "cv_accuracy_std": float(scores.std()),
        "sklearn_version": sklearn.__version__,
        "warning": (
            "Educational use only. Predictions are demonstrations, "
            "not scientific identification."
        ),
    }
    METADATA_PATH.write_text(
        json.dumps(metadata, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    print(f"Cross-validation accuracy: {scores.mean():.4f} ± {scores.std():.4f}")
    print(f"Model saved to {MODEL_PATH}")
    print(f"Metadata saved to {METADATA_PATH}")


if __name__ == "__main__":
    main()

