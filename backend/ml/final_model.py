import pandas as pd
import joblib

from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.metrics import accuracy_score, classification_report, roc_auc_score

from xgboost import XGBClassifier


# =========================================================
# 1. LOAD DATA
# =========================================================

df = pd.read_csv(
    "data/creditguard_synthetic_credit_risk_dataset.csv"
)

df = df.drop(columns=["customer_id"])


# =========================================================
# 2. FEATURES AND TARGET
# =========================================================

X = df.drop(columns=["credit_risk"])
y = df["credit_risk"]


# =========================================================
# 3. FEATURE GROUPS
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
# 4. PREPROCESSING
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
# 5. FINAL TRAIN / TEST SPLIT
# =========================================================

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=42,
    stratify=y
)

print("Training samples:", len(X_train))
print("Final test samples:", len(X_test))


# =========================================================
# 6. XGBOOST PIPELINE
# =========================================================

xgb_pipeline = Pipeline([
    ("preprocessor", preprocessor),
    ("classifier", XGBClassifier(
        random_state=42,
        eval_metric="logloss"
    ))
])


# =========================================================
# 7. HYPERPARAMETER TUNING
#    TRAINING DATA ONLY
# =========================================================

param_grid = {
    "classifier__n_estimators": [100, 200],
    "classifier__max_depth": [3, 4, 5],
    "classifier__learning_rate": [0.03, 0.05, 0.1]
}

print("\nTuning XGBoost on training data...")

grid_search = GridSearchCV(
    xgb_pipeline,
    param_grid,
    cv=5,
    scoring="roc_auc",
    n_jobs=-1
)

grid_search.fit(X_train, y_train)


# =========================================================
# 8. BEST MODEL
# =========================================================

final_model = grid_search.best_estimator_

print("\n====================================")
print("BEST PARAMETERS")
print("====================================")

print(grid_search.best_params_)

print("\nTraining CV ROC-AUC:")
print(round(grid_search.best_score_, 4))


# =========================================================
# 9. FINAL TEST
# =========================================================

y_pred = final_model.predict(X_test)

y_probability = final_model.predict_proba(X_test)[:, 1]


# =========================================================
# 10. FINAL METRICS
# =========================================================

accuracy = accuracy_score(
    y_test,
    y_pred
)

roc_auc = roc_auc_score(
    y_test,
    y_probability
)

print("\n====================================")
print("FINAL TEST PERFORMANCE")
print("====================================")

print("Accuracy:", round(accuracy, 4))
print("ROC-AUC:", round(roc_auc, 4))

print("\nClassification Report:")

print(
    classification_report(
        y_test,
        y_pred,
        target_names=[
            "Poor Credit",
            "Good Credit"
        ]
    )
)


# =========================================================
# 11. SAVE FINAL MODEL
# =========================================================

joblib.dump(
    final_model,
    "models/credit_risk_model.pkl"
)

print("\n====================================")
print("FINAL MODEL SAVED")
print("====================================")

print("models/credit_risk_model.pkl")