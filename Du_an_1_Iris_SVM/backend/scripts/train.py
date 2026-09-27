"""
Train multiple SVM models for the Iris dataset.
Each kernel type = 1 version of the model.

Versions:
  v1 = Linear kernel
  v2 = RBF kernel
  v3 = Polynomial kernel
  v4 = Sigmoid kernel
"""

import json
from pathlib import Path

import joblib
import sklearn
from sklearn import datasets
from sklearn.model_selection import StratifiedKFold, cross_val_score
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.svm import SVC


BASE_DIR = Path(__file__).resolve().parents[1]
ARTIFACT_DIR = BASE_DIR / "artifacts"

KERNELS = [
    {"version": "v1", "kernel": "linear",  "display": "Linear (Tuyến tính)"},
    {"version": "v2", "kernel": "rbf",     "display": "RBF (Radial Basis Function)"},
    {"version": "v3", "kernel": "poly",    "display": "Polynomial (Đa thức)"},
    {"version": "v4", "kernel": "sigmoid", "display": "Sigmoid"},
]


def main() -> None:
    iris = datasets.load_iris()
    X = iris.data
    y = iris.target

    ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)

    all_models_meta = []

    for cfg in KERNELS:
        ver = cfg["version"]
        kern = cfg["kernel"]
        display = cfg["display"]

        print(f"\n{'='*50}")
        print(f"Training {ver}: SVM kernel={kern}")
        print(f"{'='*50}")

        # Pipeline: StandardScaler + SVC (important for sigmoid & poly)
        pipe = Pipeline([
            ("scaler", StandardScaler()),
            ("svc", SVC(kernel=kern, probability=True, random_state=42)),
        ])

        # Cross-validation
        cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
        scores = cross_val_score(pipe, X, y, cv=cv, scoring="accuracy")

        # Fit on full data
        pipe.fit(X, y)

        # Save model
        model_path = ARTIFACT_DIR / f"iris_svm_{kern}.joblib"
        joblib.dump(pipe, model_path)

        accuracy_mean = float(scores.mean())
        accuracy_std = float(scores.std())

        model_meta = {
            "version": ver,
            "kernel": kern,
            "display_name": display,
            "cv_accuracy_mean": accuracy_mean,
            "cv_accuracy_std": accuracy_std,
            "model_file": f"iris_svm_{kern}.joblib",
        }
        all_models_meta.append(model_meta)

        print(f"  Accuracy: {accuracy_mean:.4f} ± {accuracy_std:.4f}")
        print(f"  Saved to: {model_path}")

    # Save unified metadata
    metadata = {
        "project": "iris-svm-multikernel",
        "model_version": "2.0.0",
        "feature_names": list(iris.feature_names),
        "class_mapping": {
            str(index): name for index, name in enumerate(iris.target_names)
        },
        "models": all_models_meta,
        "default_kernel": "rbf",
        "sklearn_version": sklearn.__version__,
        "warning": (
            "Educational use only. Predictions are demonstrations, "
            "not scientific identification."
        ),
    }

    metadata_path = ARTIFACT_DIR / "metadata.json"
    metadata_path.write_text(
        json.dumps(metadata, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    print(f"\n{'='*50}")
    print(f"All models trained successfully!")
    print(f"Metadata saved to {metadata_path}")
    print(f"{'='*50}")

    # Summary table
    print(f"\n{'Version':<10} {'Kernel':<12} {'Accuracy':<20}")
    print("-" * 42)
    for m in all_models_meta:
        print(f"{m['version']:<10} {m['kernel']:<12} {m['cv_accuracy_mean']:.4f} ± {m['cv_accuracy_std']:.4f}")


if __name__ == "__main__":
    main()
