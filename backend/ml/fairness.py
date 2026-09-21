import pandas as pd
import joblib

from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
from fairlearn.metrics import (
    demographic_parity_difference,
    equalized_odds_difference
)


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
# 3. LOAD FINAL MODEL
# =========================================================

model = joblib.load(
    "models/credit_risk_model.pkl"
)


# =========================================================
# 4. TRAIN / TEST SPLIT
# =========================================================

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=42,
    stratify=y
)


# =========================================================
# 5. PREDICTIONS
# =========================================================

predictions = model.predict(X_test)


print("\n====================================")
print("MODEL PERFORMANCE")
print("====================================")

print(
    "Accuracy:",
    round(
        accuracy_score(y_test, predictions),
        4
    )
)


# =========================================================
# 6. SEX-BASED FAIRNESS
# =========================================================

sensitive_feature = X_test["sex"]


# =========================================================
# 7. DEMOGRAPHIC PARITY
# =========================================================

dp_difference = demographic_parity_difference(
    y_test,
    predictions,
    sensitive_features=sensitive_feature
)


# =========================================================
# 8. EQUALIZED ODDS
# =========================================================

eo_difference = equalized_odds_difference(
    y_test,
    predictions,
    sensitive_features=sensitive_feature
)


# =========================================================
# 9. DISPLAY RESULTS
# =========================================================

print("\n====================================")
print("FAIRNESS ANALYSIS")
print("====================================")

print(
    "Sensitive Feature: Sex"
)

print(
    "Demographic Parity Difference:",
    round(dp_difference, 4)
)

print(
    "Equalized Odds Difference:",
    round(eo_difference, 4)
)


# =========================================================
# 10. GROUP PERFORMANCE
# =========================================================

print("\n====================================")
print("GROUP-WISE RESULTS")
print("====================================")

for group in sensitive_feature.unique():

    mask = sensitive_feature == group

    group_accuracy = accuracy_score(
        y_test[mask],
        predictions[mask]
    )

    positive_rate = predictions[mask].mean()

    print("\nGroup:", group)

    print(
        "Accuracy:",
        round(group_accuracy, 4)
    )

    print(
        "Good Credit Prediction Rate:",
        round(positive_rate, 4)
    )