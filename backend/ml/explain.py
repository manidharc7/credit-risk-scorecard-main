import pandas as pd
import joblib
import shap


# =========================================================
# 1. LOAD FINAL MODEL
# =========================================================

model = joblib.load(
    "models/credit_risk_model.pkl"
)

print("Final model loaded successfully!")


# =========================================================
# 2. SAMPLE CUSTOMER
# =========================================================

customer = pd.DataFrame([{
    "age": 30,
    "sex": "male",
    "employment_type": "salaried",
    "employment_years": 6,
    "monthly_income": 60000,
    "cibil_score": 720,
    "past_loans": 3,
    "on_time_payments": 55,
    "late_payments": 3,
    "defaults": 0,
    "existing_loans": 1,
    "existing_emi": 8000,
    "credit_utilization": 0.30,
    "dti_ratio": 0.25,
    "bank_balance": 250000,
    "savings_balance": 100000,
    "new_loan_amount": 300000,
    "loan_duration_months": 36,
    "loan_purpose": "home",
    "identity_verified": 1,
    "address_verified": 1,
    "employment_verified": 1,
    "background_verified": 1,
    "collateral_available": 1
}])


# =========================================================
# 3. MODEL COMPONENTS
# =========================================================

preprocessor = model.named_steps["preprocessor"]

xgb_model = model.named_steps["classifier"]


# =========================================================
# 4. TRANSFORM CUSTOMER
# =========================================================

transformed = preprocessor.transform(customer)

if hasattr(transformed, "toarray"):
    transformed = transformed.toarray()


# =========================================================
# 5. FEATURE NAMES
# =========================================================

feature_names = (
    preprocessor
    .get_feature_names_out()
)


# =========================================================
# 6. SHAP EXPLAINER
# =========================================================

explainer = shap.TreeExplainer(
    xgb_model
)

shap_values = explainer.shap_values(
    transformed
)


# =========================================================
# 7. PREDICTION
# =========================================================

prediction = model.predict(customer)[0]

probability = model.predict_proba(customer)[0][1]


# =========================================================
# 8. RESULT
# =========================================================

print("\n====================================")
print("CREDIT RISK RESULT")
print("====================================")

if prediction == 1:

    print("Prediction: GOOD CREDIT / LOWER RISK")

else:

    print("Prediction: POOR CREDIT / HIGHER RISK")


print(
    "Good Credit Probability:",
    round(probability * 100, 2),
    "%"
)

print(
    "Risk Score:",
    round(probability * 100)
    if prediction == 1
    else round((1 - probability) * 100)
)


# =========================================================
# 9. SHAP VALUES
# =========================================================

values = shap_values[0]

explanation = pd.DataFrame({
    "Feature": feature_names,
    "SHAP Value": values
})

explanation["Absolute Impact"] = (
    explanation["SHAP Value"].abs()
)

explanation = explanation.sort_values(
    "Absolute Impact",
    ascending=False
)


# =========================================================
# 10. DISPLAY TOP FACTORS
# =========================================================

print("\n====================================")
print("TOP SHAP FACTORS")
print("====================================")

print(
    explanation[
        ["Feature", "SHAP Value"]
    ].head(10).to_string(index=False)
)