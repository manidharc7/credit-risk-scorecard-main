from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import requests
from dotenv import load_dotenv

import pandas as pd
import joblib
import shap

from groq import Groq


# ============================================================
# 1. CREATE FLASK APP
# ============================================================

app = Flask(__name__)

load_dotenv()

ALLOWED_ORIGIN = os.getenv("ALLOWED_ORIGIN", "*")
CORS(app, origins=[ALLOWED_ORIGIN] if ALLOWED_ORIGIN != "*" else "*")

SENDGRID_API_KEY = os.getenv("SENDGRID_API_KEY")
SENDGRID_FROM_EMAIL = os.getenv("SENDGRID_FROM_EMAIL")
SENDGRID_FROM_NAME = os.getenv("SENDGRID_FROM_NAME", "CreditGuard AI")

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
groq_client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None


# ============================================================
# 2. LOAD FINAL MODEL
# ============================================================

model = joblib.load(
    "models/credit_risk_model.pkl"
)

print("CreditGuard XGBoost model loaded successfully!")


# ============================================================
# 3. SHAP COMPONENTS
# ============================================================

preprocessor = model.named_steps["preprocessor"]

xgb_model = model.named_steps["classifier"]

explainer = shap.TreeExplainer(xgb_model)

feature_names = preprocessor.get_feature_names_out()


# ============================================================
# 4. HOME
# ============================================================

@app.route("/")
def home():

    return jsonify({
        "message": "CreditGuard AI ML API is running",
        "model": "XGBoost",
        "status": "ready"
    })


# ============================================================
# 5. SHARED ML PIPELINE
# ============================================================
#
# Runs the model + SHAP explanation for a customer payload.
# Stateless — no persistence. Callers (the frontend) are
# responsible for writing results to Firestore when needed.
#
# ============================================================

def build_customer_frame(data):

    return pd.DataFrame([{

        "age": int(data["age"]),
        "sex": data["sex"],
        "employment_type": data["employment_type"],
        "employment_years": float(data["employment_years"]),

        "monthly_income": float(data["monthly_income"]),
        "cibil_score": int(data["cibil_score"]),

        "past_loans": int(data["past_loans"]),
        "on_time_payments": int(data["on_time_payments"]),
        "late_payments": int(data["late_payments"]),
        "defaults": int(data["defaults"]),

        "existing_loans": int(data["existing_loans"]),
        "existing_emi": float(data["existing_emi"]),

        "credit_utilization": float(data["credit_utilization"]),
        "dti_ratio": float(data["dti_ratio"]),

        "bank_balance": float(data["bank_balance"]),
        "savings_balance": float(data["savings_balance"]),

        "new_loan_amount": float(data["new_loan_amount"]),
        "loan_duration_months": int(data["loan_duration_months"]),
        "loan_purpose": data["loan_purpose"],

        "identity_verified": int(data["identity_verified"]),
        "address_verified": int(data["address_verified"]),
        "employment_verified": int(data["employment_verified"]),
        "background_verified": int(data["background_verified"]),
        "collateral_available": int(data["collateral_available"])
    }])


def run_assessment(data):

    customer = build_customer_frame(data)

    prediction = int(model.predict(customer)[0])
    probabilities = model.predict_proba(customer)[0]

    poor_probability = float(probabilities[0])
    good_probability = float(probabilities[1])

    if prediction == 1:
        decision = "GOOD CREDIT"
        risk_label = "LOWER RISK"
    else:
        decision = "POOR CREDIT"
        risk_label = "HIGHER RISK"

    credit_score = round(good_probability * 100)

    transformed = preprocessor.transform(customer)

    if hasattr(transformed, "toarray"):
        transformed = transformed.toarray()

    shap_values = explainer.shap_values(transformed)
    values = shap_values[0]

    explanation = []

    for name, value in zip(feature_names, values):

        clean_name = name
        clean_name = clean_name.replace("num__", "")
        clean_name = clean_name.replace("cat__", "")

        explanation.append({
            "feature": clean_name,
            "impact": round(float(value), 4),
            "direction": "reduces_risk" if value > 0 else "increases_risk"
        })

    explanation.sort(key=lambda x: abs(x["impact"]), reverse=True)

    top_explanations = explanation[:8]

    customer_explanations = generate_customer_explanations(
        data,
        top_explanations
    )

    improvement_advice = generate_improvement_advice(data)

    ai_summary = generate_ai_summary(
        decision,
        risk_label,
        credit_score,
        customer_explanations,
        improvement_advice
    )

    return {
        "decision": decision,
        "risk_label": risk_label,
        "credit_score": credit_score,
        "good_credit_probability": round(good_probability * 100, 2),
        "poor_credit_probability": round(poor_probability * 100, 2),
        "explanation": customer_explanations,
        "improvement_advice": improvement_advice,
        "ai_summary": ai_summary
    }


# ============================================================
# 6. EMPLOYEE PREDICTION API
# ============================================================
#
# Stateless. The frontend persists the result to Firestore
# itself (as the authenticated employee) after a successful
# response.
#
# ============================================================

@app.route("/predict", methods=["POST"])
def predict():

    try:

        data = request.get_json()

        customer_name = data["customerName"]
        customer_email = data["customerEmail"]

        result = run_assessment(data)

        return jsonify({
            "success": True,

            "customer": {
                "name": customer_name,
                "email": customer_email
            },

            **result
        })

    except Exception as e:

        print("PREDICTION ERROR:", str(e))

        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


# ============================================================
# 7. PERSONALIZED CUSTOMER ADVICE
# ============================================================

def generate_customer_explanations(data, top_explanations):

    explanations = []

    for item in top_explanations:

        feature = item["feature"]
        direction = item["direction"]

        clean_feature = feature.replace("_", " ")

        if "cibil_score" in feature:

            name = "CIBIL Score"

            if int(data["cibil_score"]) < 650:
                reason = (
                    "Your CIBIL score is relatively low and "
                    "may reduce your chances of loan approval."
                )
            elif int(data["cibil_score"]) < 750:
                reason = (
                    "Your CIBIL score is moderate. "
                    "A higher score can improve your credit profile."
                )
            else:
                reason = (
                    "Your CIBIL score is supporting your "
                    "overall credit profile."
                )

        elif "credit_utilization" in feature:

            name = "Credit Utilization"

            value = float(data["credit_utilization"])

            if value > 0.30:
                reason = (
                    "Your credit utilization is high, "
                    "which can increase your credit risk."
                )
            else:
                reason = (
                    "Your credit utilization is within a "
                    "healthier range."
                )

        elif "dti_ratio" in feature:

            name = "Debt-to-Income Ratio"

            value = float(data["dti_ratio"])

            if value > 0.40:
                reason = (
                    "A large portion of your income is going "
                    "towards debt, increasing your financial burden."
                )
            else:
                reason = (
                    "Your debt-to-income ratio is at a "
                    "manageable level."
                )

        elif "late_payments" in feature:

            name = "Late Payments"

            value = int(data["late_payments"])

            if value > 0:
                reason = (
                    f"You have {value} late payment(s), "
                    "which can negatively affect your repayment history."
                )
            else:
                reason = (
                    "You have maintained timely payment behaviour."
                )

        elif "defaults" in feature:

            name = "Loan Defaults"

            value = int(data["defaults"])

            if value > 0:
                reason = (
                    f"You have {value} recorded default(s), "
                    "which can significantly increase credit risk."
                )
            else:
                reason = (
                    "You have no recorded loan defaults."
                )

        elif "existing_emi" in feature:

            name = "Existing EMI"

            income = float(data["monthly_income"])
            emi = float(data["existing_emi"])

            if income > 0 and emi > income * 0.30:
                reason = (
                    "Your existing EMI is relatively high compared "
                    "with your monthly income."
                )
            else:
                reason = (
                    "Your existing EMI burden is relatively manageable."
                )

        elif "existing_loans" in feature:

            name = "Existing Loans"

            value = int(data["existing_loans"])

            if value > 2:
                reason = (
                    "You currently have several active loans, "
                    "which can increase your overall debt burden."
                )
            else:
                reason = (
                    "Your number of existing loans is relatively manageable."
                )

        elif "on_time_payments" in feature:

            name = "On-Time Payments"

            value = int(data["on_time_payments"])

            if value > 0:
                reason = (
                    f"You have {value} on-time payment(s), "
                    "which supports a healthier repayment history."
                )
            else:
                reason = (
                    "A limited history of on-time payments may "
                    "affect your credit profile."
                )

        elif "savings_balance" in feature:

            name = "Savings Balance"

            income = float(data["monthly_income"])
            savings = float(data["savings_balance"])

            if income > 0 and savings < income * 3:
                reason = (
                    "Your savings balance is relatively low compared "
                    "with your monthly income."
                )
            else:
                reason = (
                    "Your savings provide a healthier financial cushion."
                )

        elif "bank_balance" in feature:

            name = "Bank Balance"

            income = float(data["monthly_income"])
            balance = float(data["bank_balance"])

            if income > 0 and balance < income:
                reason = (
                    "Your current bank balance is relatively low "
                    "compared with your monthly income."
                )
            else:
                reason = (
                    "Your bank balance supports your financial stability."
                )

        elif "monthly_income" in feature:

            name = "Monthly Income"

            reason = (
                "Your monthly income is one of the factors considered "
                "when evaluating your ability to manage loan obligations."
            )

        elif "employment_years" in feature:

            name = "Employment Stability"

            reason = (
                "Employment stability is considered when assessing "
                "your ability to maintain regular loan repayments."
            )

        else:

            name = clean_feature.replace("cat ", "").title()

            if direction == "reduces_risk":
                reason = (
                    "This factor is supporting your overall "
                    "credit profile."
                )
            else:
                reason = (
                    "This factor is contributing to your "
                    "overall credit risk."
                )

        explanations.append({
            "feature": name,
            "impact": item["impact"],
            "direction": direction,
            "reason": reason
        })

    return explanations


def generate_improvement_advice(data):

    advice = []

    if int(data["cibil_score"]) < 750:
        advice.append(
            "Improve your CIBIL score by making all loan and credit-card payments on time."
        )

    if float(data["credit_utilization"]) > 0.30:
        advice.append(
            "Reduce your credit utilization. Try to keep your outstanding credit balance below 30% of your available credit limit."
        )

    if float(data["dti_ratio"]) > 0.40:
        advice.append(
            "Reduce your debt-to-income ratio by lowering existing debt or increasing your monthly income."
        )

    if int(data["late_payments"]) > 0:
        advice.append(
            "Avoid late payments and maintain a consistent repayment history."
        )

    if int(data["defaults"]) > 0:
        advice.append(
            "Resolve outstanding defaults and maintain a clean repayment history."
        )

    if int(data["existing_loans"]) > 2:
        advice.append(
            "Consider reducing the number of active loans before applying for additional credit."
        )

    monthly_income = float(data["monthly_income"])
    existing_emi = float(data["existing_emi"])

    if monthly_income > 0 and existing_emi > monthly_income * 0.30:
        advice.append(
            "Try to reduce your existing EMI burden so that more of your monthly income remains available."
        )

    savings_balance = float(data["savings_balance"])

    if monthly_income > 0 and savings_balance < monthly_income * 3:
        advice.append(
            "Build a stronger savings balance to maintain a healthier financial profile."
        )

    bank_balance = float(data["bank_balance"])

    if monthly_income > 0 and bank_balance < monthly_income:
        advice.append(
            "Maintain a healthier bank balance and sufficient financial reserves."
        )

    advice = list(dict.fromkeys(advice))

    if not advice:
        advice = [
            "Continue making all payments on time.",
            "Keep credit utilization low.",
            "Maintain a manageable debt-to-income ratio.",
            "Build healthy savings and maintain stable finances."
        ]

    return advice[:5]


# ============================================================
# 7.5. AI-WRITTEN SUMMARY (Groq)
# ============================================================
#
# Groq only writes the narrative — it is given the exact factors
# already computed above (SHAP-derived, deterministic) and told
# not to introduce anything beyond them, so this can't invent a
# reason the model didn't actually use. Optional: if no API key is
# configured, or the call fails for any reason, callers just get
# ai_summary: null and the rest of the report is unaffected.
#
# ============================================================

def generate_ai_summary(
    decision,
    risk_label,
    credit_score,
    customer_explanations,
    improvement_advice
):

    if not groq_client:
        return None

    factors_text = "\n".join(
        f"- {item['feature']}: {item['reason']} "
        f"({'supports' if item['direction'] == 'reduces_risk' else 'hurts'} the score)"
        for item in customer_explanations
    )

    advice_text = "\n".join(f"- {item}" for item in improvement_advice)

    prompt = f"""Decision: {decision}
Risk level: {risk_label}
Credit risk score: {credit_score}/100

Factors behind this result:
{factors_text}

Improvement advice already generated:
{advice_text}

Write a short, warm, plain-English summary (3-4 sentences max) of this
credit risk result for the customer. Only reference the factors and
advice listed above — do not invent any new reasons, numbers, or advice
that isn't already there. Speak directly to the customer ("you"/"your").
No headers, no bullet points, just plain prose."""

    try:
        completion = groq_client.chat.completions.create(
            model="openai/gpt-oss-20b",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a concise financial explainer. You only "
                        "summarize facts given to you — you never invent "
                        "figures, reasons, or advice that weren't provided."
                    ),
                },
                {"role": "user", "content": prompt},
            ],
            temperature=0.4,
            max_tokens=400,
            reasoning_effort="low",
        )

        return completion.choices[0].message.content.strip()

    except Exception as e:

        print("GROQ SUMMARY ERROR:", str(e))

        return None


# ============================================================
# 8. CUSTOMER SELF-ASSESSMENT
# ============================================================
#
# Stateless — nothing is persisted, matching prior behavior.
#
# ============================================================

@app.route("/customer/predict", methods=["POST"])
def customer_predict():

    try:

        data = request.get_json()

        result = run_assessment(data)

        return jsonify({
            "success": True,
            **result
        })

    except Exception as e:

        print("CUSTOMER PREDICTION ERROR:", str(e))

        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


# ============================================================
# 9. SEND ASSESSMENT RESULT TO CUSTOMER EMAIL
# ============================================================

@app.route("/send-result", methods=["POST"])
def send_result():

    try:

        data = request.get_json()

        customer_name = data["customerName"]
        customer_email = data["customerEmail"]

        decision = data["decision"]
        risk_label = data["risk_label"]
        credit_score = data["credit_score"]

        good_probability = data["good_credit_probability"]
        poor_probability = data["poor_credit_probability"]

        explanations = data.get("explanation", [])
        improvement_advice = data.get("improvement_advice", [])

        if not SENDGRID_API_KEY or not SENDGRID_FROM_EMAIL:
            return jsonify({
                "success": False,
                "error": "Email is not configured on the server (missing SENDGRID_API_KEY or SENDGRID_FROM_EMAIL)."
            }), 500

        email_body = f"""
Dear {customer_name},

Thank you for using CreditGuard AI.

Your credit risk assessment has been completed.

============================================================
CREDIT RISK ASSESSMENT RESULT
============================================================

Decision:
{decision}

Risk Level:
{risk_label}

Credit Risk Score:
{credit_score}/100

Good Credit Probability:
{good_probability}%

Poor Credit Probability:
{poor_probability}%


============================================================
WHY THIS RESULT WAS GIVEN
============================================================

The CreditGuard AI model analyzed multiple financial and
credit-related factors to determine your overall credit risk.

The most influential factors identified by the AI model are:

"""

        if explanations:

            for index, item in enumerate(explanations, start=1):

                feature = item.get("feature", "Unknown Factor")
                impact = item.get("impact", 0)
                direction = item.get("direction", "")
                reason = item.get("reason", "")

                if direction == "reduces_risk":
                    effect = "Supports your credit profile"
                else:
                    effect = "Increases your credit risk"

                email_body += f"""
{index}. {feature}
   Impact: {impact}
   Effect: {effect}
   Explanation: {reason}

"""

        else:

            email_body += """
No specific influential factors were available.
"""

        email_body += """

============================================================
HOW YOU CAN IMPROVE YOUR CREDIT PROFILE
============================================================

"""

        if improvement_advice:

            for index, advice in enumerate(improvement_advice, start=1):
                email_body += f"{index}. {advice}\n"

        else:

            email_body += """
Continue maintaining timely payments and healthy financial
management.
"""

        email_body += """

============================================================
IMPORTANT NOTE
============================================================

This assessment is generated using an artificial intelligence
credit risk model and is intended for decision-support and
informational purposes.

The result is not a guarantee of loan approval or rejection.
Actual lending decisions may depend on additional information,
policies, verification procedures, and the lending institution.

Please consult a qualified financial professional for
personalized financial advice.

Thank you for using CreditGuard AI.

Regards,
CreditGuard AI
Intelligent Credit Risk Platform
"""

        sendgrid_response = requests.post(
            "https://api.sendgrid.com/v3/mail/send",
            headers={
                "Authorization": f"Bearer {SENDGRID_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "personalizations": [
                    {"to": [{"email": customer_email}]}
                ],
                "from": {
                    "email": SENDGRID_FROM_EMAIL,
                    "name": SENDGRID_FROM_NAME,
                },
                "subject": "CreditGuard AI – Your Credit Risk Assessment Result",
                "content": [
                    {"type": "text/plain", "value": email_body}
                ],
            },
            timeout=15,
        )

        if sendgrid_response.status_code not in (200, 202):

            print(
                "SENDGRID ERROR:",
                sendgrid_response.status_code,
                sendgrid_response.text
            )

            try:
                error_detail = sendgrid_response.json()["errors"][0]["message"]
            except Exception:
                error_detail = "Failed to send email via SendGrid"

            return jsonify({
                "success": False,
                "error": error_detail
            }), 502

        return jsonify({
            "success": True,
            "message": "Assessment result sent successfully to customer"
        })

    except Exception as e:

        print("EMAIL SENDING ERROR:", str(e))

        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


# ============================================================
# 10. START SERVER
# ============================================================

if __name__ == "__main__":

    port = int(os.getenv("PORT", 5000))

    app.run(
        host="0.0.0.0",
        port=port,
        debug=False
    )
