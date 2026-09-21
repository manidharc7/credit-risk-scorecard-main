import pandas as pd
import joblib

from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    roc_auc_score
)

from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from xgboost import XGBClassifier


# =========================================================
# 1. LOAD DATASET
# =========================================================

df = pd.read_csv("data/creditguard_synthetic_credit_risk_dataset.csv")

print("\nDataset loaded successfully!")
print("Dataset shape:", df.shape)


# =========================================================
# 2. REMOVE ID
# =========================================================

df = df.drop(columns=["customer_id"])


# =========================================================
# 3. TARGET
# =========================================================

X = df.drop(columns=["credit_risk"])
y = df["credit_risk"]

print("\nTarget distribution:")
print(y.value_counts())


# =========================================================
# 4. IDENTIFY FEATURES
# =========================================================

categorical_features = [
    "sex",
    "employment_type",
    "loan_purpose"
]

numeric_features = [
    "age",
    "employment_years",
    "monthly_income",
    "cibil_score",
    "past_loans",
    "on_time_payments",
    "late_payments",
    "defaults",
    "existing_loans",
    "existing_emi",
    "credit_utilization",
    "dti_ratio",
    "bank_balance",
    "savings_balance",
    "new_loan_amount",
    "loan_duration_months",
    "identity_verified",
    "address_verified",
    "employment_verified",
    "background_verified",
    "collateral_available"
]


# =========================================================
# 5. PREPROCESSING
# =========================================================

numeric_pipeline = Pipeline([
    ("imputer", SimpleImputer(strategy="median")),
    ("scaler", StandardScaler())
])

categorical_pipeline = Pipeline([
    ("imputer", SimpleImputer(strategy="most_frequent")),
    ("encoder", OneHotEncoder(handle_unknown="ignore"))
])

preprocessor = ColumnTransformer([
    ("num", numeric_pipeline, numeric_features),
    ("cat", categorical_pipeline, categorical_features)
])


# =========================================================
# 6. TRAIN / TEST SPLIT
# =========================================================

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=42,
    stratify=y
)

print("\nTraining samples:", len(X_train))
print("Testing samples:", len(X_test))


# =========================================================
# 7. MODELS
# =========================================================

models = {

    "Logistic Regression": LogisticRegression(
        max_iter=2000,
        class_weight="balanced"
    ),

    "Random Forest": RandomForestClassifier(
        n_estimators=300,
        max_depth=8,
        random_state=42,
        class_weight="balanced"
    ),

    "XGBoost": XGBClassifier(
        n_estimators=200,
        max_depth=4,
        learning_rate=0.05,
        subsample=0.9,
        colsample_bytree=0.9,
        eval_metric="logloss",
        random_state=42
    )
}


# =========================================================
# 8. TRAIN AND COMPARE MODELS
# =========================================================

results = {}

for name, model in models.items():

    print("\n====================================")
    print("Training", name)
    print("====================================")

    pipeline = Pipeline([
        ("preprocessor", preprocessor),
        ("classifier", model)
    ])

    pipeline.fit(X_train, y_train)

    predictions = pipeline.predict(X_test)
    probabilities = pipeline.predict_proba(X_test)[:, 1]

    accuracy = accuracy_score(y_test, predictions)
    roc_auc = roc_auc_score(y_test, probabilities)

    results[name] = {
        "pipeline": pipeline,
        "accuracy": accuracy,
        "roc_auc": roc_auc
    }

    print("\nAccuracy:", round(accuracy, 4))
    print("ROC-AUC:", round(roc_auc, 4))

    print("\nClassification Report:")
    print(
        classification_report(
            y_test,
            predictions,
            target_names=[
                "Poor Credit",
                "Good Credit"
            ]
        )
    )


# =========================================================
# 9. CROSS VALIDATION
# =========================================================

print("\n====================================")
print("5-FOLD CROSS-VALIDATION")
print("====================================")

cv = StratifiedKFold(
    n_splits=5,
    shuffle=True,
    random_state=42
)

for name, result in results.items():

    scores = cross_val_score(
        result["pipeline"],
        X,
        y,
        cv=cv,
        scoring="roc_auc"
    )

    print("\n", name)
    print("Scores:", scores)
    print("Mean ROC-AUC:", round(scores.mean(), 4))


# =========================================================
# 10. SELECT BEST MODEL
# =========================================================

best_model_name = max(
    results,
    key=lambda name: results[name]["roc_auc"]
)

best_model = results[best_model_name]["pipeline"]

print("\n====================================")
print("BEST MODEL")
print("====================================")

print("Selected:", best_model_name)
print(
    "ROC-AUC:",
    round(results[best_model_name]["roc_auc"], 4)
)


# =========================================================
# 11. SAVE MODEL
# =========================================================

joblib.dump(
    best_model,
    "models/credit_risk_model.pkl"
)

print("\n====================================")
print("MODEL SAVED")
print("====================================")

print("models/credit_risk_model.pkl")