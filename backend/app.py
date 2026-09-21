from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import smtplib
from email.message import EmailMessage
from dotenv import load_dotenv

import pandas as pd
import joblib
import shap
import json
import hashlib

from database import get_connection, init_database


# ============================================================
# 1. CREATE FLASK APP
# ============================================================

app = Flask(__name__)
CORS(app)
load_dotenv()

MAIL_USERNAME = os.getenv("MAIL_USERNAME")
MAIL_PASSWORD = os.getenv("MAIL_PASSWORD")

# ============================================================
# 2. INITIALIZE DATABASE
# ============================================================

init_database()


# ============================================================
# 3. LOAD FINAL MODEL
# ============================================================

model = joblib.load(
    "models/credit_risk_model.pkl"
)

print("CreditGuard XGBoost model loaded successfully!")


# ============================================================
# 4. SHAP COMPONENTS
# ============================================================

preprocessor = model.named_steps["preprocessor"]

xgb_model = model.named_steps["classifier"]

explainer = shap.TreeExplainer(xgb_model)

feature_names = preprocessor.get_feature_names_out()


# ============================================================
# 5. HOME
# ============================================================

@app.route("/")
def home():

    return jsonify({
        "message": "CreditGuard AI API is running",
        "model": "XGBoost",
        "status": "ready"
    })


# ============================================================
# 6. AUTHENTICATION - SIGN UP
# ============================================================

@app.route("/signup", methods=["POST"])
def signup():

    try:

        data = request.get_json()

        name = data["name"]
        email = data["email"]
        phone = data["phone"]
        username = data["username"]
        password = data["password"]
        role = data["role"]

        employee_id = data.get("employee_id")

        # Password hashing
        password_hash = hashlib.sha256(
            password.encode()
        ).hexdigest()

        connection = get_connection()
        cursor = connection.cursor()

        # ----------------------------------------------------
        # Check username/email
        # ----------------------------------------------------

        cursor.execute(
            """
            SELECT id
            FROM users
            WHERE username = ?
            OR email = ?
            """,
            (
                username,
                email
            )
        )

        existing_user = cursor.fetchone()

        if existing_user:

            connection.close()

            return jsonify({
                "success": False,
                "error": "Username or email already exists"
            }), 400


        # ----------------------------------------------------
        # Employee ID required for employee
        # ----------------------------------------------------

        if role == "employee" and not employee_id:

            connection.close()

            return jsonify({
                "success": False,
                "error": "Employee ID is required"
            }), 400


        # ----------------------------------------------------
        # Create account
        # ----------------------------------------------------

        cursor.execute(
            """
            INSERT INTO users
            (
                name,
                email,
                phone,
                username,
                password_hash,
                role,
                employee_id
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                name,
                email,
                phone,
                username,
                password_hash,
                role,
                employee_id
            )
        )

        connection.commit()
        connection.close()


        return jsonify({
            "success": True,
            "message": "Account created successfully"
        })


    except Exception as e:

        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


# ============================================================
# 7. AUTHENTICATION - LOGIN
# ============================================================

@app.route("/login", methods=["POST"])
def login():

    try:

        data = request.get_json()

        username = data["username"]
        password = data["password"]
        role = data["role"]

        password_hash = hashlib.sha256(
            password.encode()
        ).hexdigest()

        connection = get_connection()
        cursor = connection.cursor()


        # ----------------------------------------------------
        # Employee login
        # ----------------------------------------------------

        if role == "employee":

            employee_id = data.get("employee_id")

            cursor.execute(
                """
                SELECT *
                FROM users
                WHERE employee_id = ?
                AND password_hash = ?
                AND role = 'employee'
                """,
                (
                    employee_id,
                    password_hash
                )
            )


        # ----------------------------------------------------
        # Customer login
        # ----------------------------------------------------

        else:

            cursor.execute(
                """
                SELECT *
                FROM users
                WHERE username = ?
                AND password_hash = ?
                AND role = 'customer'
                """,
                (
                    username,
                    password_hash
                )
            )


        user = cursor.fetchone()

        connection.close()


        if not user:

            return jsonify({
                "success": False,
                "error": "Invalid login credentials"
            }), 401


        return jsonify({

            "success": True,

            "message": "Login successful",

            "user": {

                "id":
                    user["id"],

                "name":
                    user["name"],

                "email":
                    user["email"],

                "phone":
                    user["phone"],

                "username":
                    user["username"],

                "role":
                    user["role"],

                "employee_id":
                    user["employee_id"]
            }

        })


    except Exception as e:

        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


# ============================================================
# 8. EMPLOYEE PREDICTION API
# ============================================================
#
# IMPORTANT:
# Employee assessments ARE stored in the database.
#
# ============================================================

@app.route("/predict", methods=["POST"])
def predict():

    try:

        data = request.get_json()


        # ====================================================
        # CUSTOMER INFORMATION
        # ====================================================

        customer_name = data["customerName"]

        customer_email = data["customerEmail"]


        # ====================================================
        # CREATE CUSTOMER DATA FOR ML MODEL
        # ====================================================

        customer = pd.DataFrame([{

            "age":
                int(data["age"]),

            "sex":
                data["sex"],

            "employment_type":
                data["employment_type"],

            "employment_years":
                float(data["employment_years"]),

            "monthly_income":
                float(data["monthly_income"]),

            "cibil_score":
                int(data["cibil_score"]),

            "past_loans":
                int(data["past_loans"]),

            "on_time_payments":
                int(data["on_time_payments"]),

            "late_payments":
                int(data["late_payments"]),

            "defaults":
                int(data["defaults"]),

            "existing_loans":
                int(data["existing_loans"]),

            "existing_emi":
                float(data["existing_emi"]),

            "credit_utilization":
                float(data["credit_utilization"]),

            "dti_ratio":
                float(data["dti_ratio"]),

            "bank_balance":
                float(data["bank_balance"]),

            "savings_balance":
                float(data["savings_balance"]),

            "new_loan_amount":
                float(data["new_loan_amount"]),

            "loan_duration_months":
                int(data["loan_duration_months"]),

            "loan_purpose":
                data["loan_purpose"],

            "identity_verified":
                int(data["identity_verified"]),

            "address_verified":
                int(data["address_verified"]),

            "employment_verified":
                int(data["employment_verified"]),

            "background_verified":
                int(data["background_verified"]),

            "collateral_available":
                int(data["collateral_available"])
        }])


        # ====================================================
        # MODEL PREDICTION
        # ====================================================

        prediction = int(
            model.predict(customer)[0]
        )

        probabilities = model.predict_proba(
            customer
        )[0]

        poor_probability = float(
            probabilities[0]
        )

        good_probability = float(
            probabilities[1]
        )


        # ====================================================
        # DECISION
        # ====================================================

        if prediction == 1:

            decision = "GOOD CREDIT"

            risk_label = "LOWER RISK"

        else:

            decision = "POOR CREDIT"

            risk_label = "HIGHER RISK"


        # ====================================================
        # CREDIT RISK SCORE
        # ====================================================

        credit_score = round(
            good_probability * 100
        )


        # ====================================================
        # SHAP EXPLANATION
        # ====================================================

        transformed = preprocessor.transform(
            customer
        )

        if hasattr(transformed, "toarray"):

            transformed = transformed.toarray()


        shap_values = explainer.shap_values(
            transformed
        )

        values = shap_values[0]


        explanation = []


        for name, value in zip(
            feature_names,
            values
        ):

            clean_name = name

            clean_name = clean_name.replace(
                "num__",
                ""
            )

            clean_name = clean_name.replace(
                "cat__",
                ""
            )

            explanation.append({

                "feature":
                    clean_name,

                "impact":
                    round(
                        float(value),
                        4
                    ),

                "direction":
                    "reduces_risk"
                    if value > 0
                    else "increases_risk"
            })


        # ====================================================
        # SORT SHAP FACTORS
        # ====================================================

        explanation.sort(
            key=lambda x: abs(x["impact"]),
            reverse=True
        )

        top_explanations = explanation[:8]


        # ====================================================
        # SAVE CUSTOMER
        # ====================================================

        connection = get_connection()

        cursor = connection.cursor()


        cursor.execute(
            """
            INSERT INTO customers
            (name, email)
            VALUES (?, ?)
            """,
            (
                customer_name,
                customer_email
            )
        )


        customer_id = cursor.lastrowid


        # ====================================================
        # SAVE COMPLETE ASSESSMENT
        # ====================================================

        cursor.execute(
            """
            INSERT INTO assessments
            (
                customer_id,
                age,
                sex,
                employment_type,
                employment_years,
                monthly_income,
                cibil_score,
                past_loans,
                on_time_payments,
                late_payments,
                defaults,
                existing_loans,
                existing_emi,
                credit_utilization,
                dti_ratio,
                bank_balance,
                savings_balance,
                new_loan_amount,
                loan_duration_months,
                loan_purpose,
                identity_verified,
                address_verified,
                employment_verified,
                background_verified,
                collateral_available,
                decision,
                risk_label,
                risk_score,
                good_credit_probability,
                poor_credit_probability,
                shap_explanation
            )
            VALUES (
                ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
            )
            """,
            (
                customer_id,

                int(data["age"]),
                data["sex"],
                data["employment_type"],
                float(data["employment_years"]),

                float(data["monthly_income"]),
                int(data["cibil_score"]),

                int(data["past_loans"]),
                int(data["on_time_payments"]),
                int(data["late_payments"]),
                int(data["defaults"]),

                int(data["existing_loans"]),
                float(data["existing_emi"]),

                float(data["credit_utilization"]),
                float(data["dti_ratio"]),

                float(data["bank_balance"]),
                float(data["savings_balance"]),

                float(data["new_loan_amount"]),
                int(data["loan_duration_months"]),

                data["loan_purpose"],

                int(data["identity_verified"]),
                int(data["address_verified"]),
                int(data["employment_verified"]),
                int(data["background_verified"]),
                int(data["collateral_available"]),

                decision,
                risk_label,
                credit_score,

                round(
                    good_probability * 100,
                    2
                ),

                round(
                    poor_probability * 100,
                    2
                ),

                json.dumps(
                    top_explanations
                )
            )
        )


        connection.commit()

        connection.close()


    

        # ====================================================
        # CUSTOMER-FRIENDLY EXPLANATION
        # ====================================================

        customer_explanations = generate_customer_explanations(
            data,
            top_explanations
        )

        improvement_advice = generate_improvement_advice(
            data
        )


        # ====================================================
        # RETURN EMPLOYEE RESULT
        # ====================================================

        return jsonify({

            "success": True,

            "customer": {
                "name": customer_name,
                "email": customer_email
            },

            "decision": decision,

            "risk_label": risk_label,

            "credit_score": credit_score,

            "good_credit_probability":
                round(
                    good_probability * 100,
                    2
                ),

            "poor_credit_probability":
                round(
                    poor_probability * 100,
                    2
                ),

            "explanation":
                customer_explanations,

            "improvement_advice":
                improvement_advice
        })


    except Exception as e:

        print(
            "PREDICTION ERROR:",
            str(e)
        )

        return jsonify({

            "success": False,

            "error":
                str(e)

        }), 500


# ============================================================
# 9. PERSONALIZED CUSTOMER ADVICE
# ============================================================
def generate_customer_explanations(data, top_explanations):

    explanations = []

    for item in top_explanations:

        feature = item["feature"]
        direction = item["direction"]

        # Clean feature name
        clean_feature = feature.replace("_", " ")

        # ---------------- CIBIL ----------------
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

        # ---------------- CREDIT UTILIZATION ----------------
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

        # ---------------- DTI ----------------
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

        # ---------------- LATE PAYMENTS ----------------
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

        # ---------------- DEFAULTS ----------------
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

        # ---------------- EXISTING EMI ----------------
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

        # ---------------- EXISTING LOANS ----------------
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

        # ---------------- ON-TIME PAYMENTS ----------------
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

        # ---------------- SAVINGS ----------------
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

        # ---------------- BANK BALANCE ----------------
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

        # ---------------- MONTHLY INCOME ----------------
        elif "monthly_income" in feature:

            name = "Monthly Income"

            reason = (
                "Your monthly income is one of the factors considered "
                "when evaluating your ability to manage loan obligations."
            )
        

        # ---------------- EMPLOYMENT ----------------
        elif "employment_years" in feature:

            name = "Employment Stability"

            reason = (
                "Employment stability is considered when assessing "
                "your ability to maintain regular loan repayments."
            )

        # ---------------- FALLBACK ----------------
        else:

            name = (
                clean_feature
                .replace("cat ", "")
                .title()
            )

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

            "impact":
                item["impact"],

            "direction":
                direction,

            "reason":
                reason

        })

    return explanations
def generate_improvement_advice(data):

    advice = []


    # --------------------------------------------------------
    # CIBIL
    # --------------------------------------------------------

    if int(data["cibil_score"]) < 750:

        advice.append(
            "Improve your CIBIL score by making all loan and credit-card payments on time."
        )


    # --------------------------------------------------------
    # CREDIT UTILIZATION
    # --------------------------------------------------------

    if float(data["credit_utilization"]) > 0.30:

        advice.append(
            "Reduce your credit utilization. Try to keep your outstanding credit balance below 30% of your available credit limit."
        )


    # --------------------------------------------------------
    # DTI
    # --------------------------------------------------------

    if float(data["dti_ratio"]) > 0.40:

        advice.append(
            "Reduce your debt-to-income ratio by lowering existing debt or increasing your monthly income."
        )


    # --------------------------------------------------------
    # LATE PAYMENTS
    # --------------------------------------------------------

    if int(data["late_payments"]) > 0:

        advice.append(
            "Avoid late payments and maintain a consistent repayment history."
        )


    # --------------------------------------------------------
    # DEFAULTS
    # --------------------------------------------------------

    if int(data["defaults"]) > 0:

        advice.append(
            "Resolve outstanding defaults and maintain a clean repayment history."
        )


    # --------------------------------------------------------
    # EXISTING LOANS
    # --------------------------------------------------------

    if int(data["existing_loans"]) > 2:

        advice.append(
            "Consider reducing the number of active loans before applying for additional credit."
        )


    # --------------------------------------------------------
    # EXISTING EMI
    # --------------------------------------------------------

    monthly_income = float(
        data["monthly_income"]
    )

    existing_emi = float(
        data["existing_emi"]
    )

    if (
        monthly_income > 0
        and existing_emi > monthly_income * 0.30
    ):

        advice.append(
            "Try to reduce your existing EMI burden so that more of your monthly income remains available."
        )


    # --------------------------------------------------------
    # SAVINGS
    # --------------------------------------------------------

    savings_balance = float(
        data["savings_balance"]
    )

    if (
        monthly_income > 0
        and savings_balance < monthly_income * 3
    ):

        advice.append(
            "Build a stronger savings balance to maintain a healthier financial profile."
        )


    # --------------------------------------------------------
    # BANK BALANCE
    # --------------------------------------------------------

    bank_balance = float(
        data["bank_balance"]
    )

    if (
        monthly_income > 0
        and bank_balance < monthly_income
    ):

        advice.append(
            "Maintain a healthier bank balance and sufficient financial reserves."
        )


    # --------------------------------------------------------
    # REMOVE DUPLICATES
    # --------------------------------------------------------

    advice = list(
        dict.fromkeys(advice)
    )


    # --------------------------------------------------------
    # FALLBACK
    # --------------------------------------------------------

    if not advice:

        advice = [

            "Continue making all payments on time.",

            "Keep credit utilization low.",

            "Maintain a manageable debt-to-income ratio.",

            "Build healthy savings and maintain stable finances."
        ]


    return advice[:5]


# ============================================================
# 10. CUSTOMER SELF-ASSESSMENT
# ============================================================
#
# IMPORTANT:
#
# Customer assessment is CALCULATION ONLY.
#
# NOTHING is inserted into:
#
# customers
# assessments
#
# ============================================================

@app.route(
    "/customer/predict",
    methods=["POST"]
)
def customer_predict():

    try:

        data = request.get_json()


        # ====================================================
        # CUSTOMER DATA FOR ML MODEL
        # ====================================================

        customer = pd.DataFrame([{

            "age":
                int(data["age"]),

            "sex":
                data["sex"],

            "employment_type":
                data["employment_type"],

            "employment_years":
                float(data["employment_years"]),

            "monthly_income":
                float(data["monthly_income"]),

            "cibil_score":
                int(data["cibil_score"]),

            "past_loans":
                int(data["past_loans"]),

            "on_time_payments":
                int(data["on_time_payments"]),

            "late_payments":
                int(data["late_payments"]),

            "defaults":
                int(data["defaults"]),

            "existing_loans":
                int(data["existing_loans"]),

            "existing_emi":
                float(data["existing_emi"]),

            "credit_utilization":
                float(data["credit_utilization"]),

            "dti_ratio":
                float(data["dti_ratio"]),

            "bank_balance":
                float(data["bank_balance"]),

            "savings_balance":
                float(data["savings_balance"]),

            "new_loan_amount":
                float(data["new_loan_amount"]),

            "loan_duration_months":
                int(data["loan_duration_months"]),

            "loan_purpose":
                data["loan_purpose"],

            "identity_verified":
                int(data["identity_verified"]),

            "address_verified":
                int(data["address_verified"]),

            "employment_verified":
                int(data["employment_verified"]),

            "background_verified":
                int(data["background_verified"]),

            "collateral_available":
                int(data["collateral_available"])
        }])


        # ====================================================
        # MODEL PREDICTION
        # ====================================================

        prediction = int(
            model.predict(customer)[0]
        )

        probabilities = model.predict_proba(
            customer
        )[0]


        poor_probability = float(
            probabilities[0]
        )

        good_probability = float(
            probabilities[1]
        )


        # ====================================================
        # DECISION
        # ====================================================

        if prediction == 1:

            decision = "GOOD CREDIT"

            risk_label = "LOWER RISK"

        else:

            decision = "POOR CREDIT"

            risk_label = "HIGHER RISK"


        # ====================================================
        # CREDIT RISK SCORE
        # ====================================================

        credit_score = round(
            good_probability * 100
        )


        # ====================================================
        # SHAP EXPLANATION
        # ====================================================

        transformed = preprocessor.transform(
            customer
        )

        if hasattr(
            transformed,
            "toarray"
        ):

            transformed = transformed.toarray()


        shap_values = explainer.shap_values(
            transformed
        )

        values = shap_values[0]


        explanation = []


        for name, value in zip(
            feature_names,
            values
        ):

            clean_name = name

            clean_name = clean_name.replace(
                "num__",
                ""
            )

            clean_name = clean_name.replace(
                "cat__",
                ""
            )

            explanation.append({

                "feature":
                    clean_name,

                "impact":
                    round(
                        float(value),
                        4
                    ),

                "direction":
                    "reduces_risk"
                    if value > 0
                    else "increases_risk"
            })


        # ====================================================
        # SORT SHAP FACTORS
        # ====================================================

        explanation.sort(
            key=lambda x: abs(x["impact"]),
            reverse=True
        )

        top_explanations = explanation[:8]
        customer_explanations = generate_customer_explanations(
            data,
            top_explanations
)


        # ====================================================
        # PERSONALIZED ADVICE
        # ====================================================

        improvement_advice = (
            generate_improvement_advice(data)
        )


        # ====================================================
        # NO DATABASE STORAGE
        # ====================================================

        return jsonify({

            "success":
                True,

            "decision":
                decision,

            "risk_label":
                risk_label,

            "credit_score":
                credit_score,

            "good_credit_probability":
                round(
                    good_probability * 100,
                    2
                ),

            "poor_credit_probability":
                round(
                    poor_probability * 100,
                    2
                ),

            "explanation":
                customer_explanations,

            "improvement_advice":
                improvement_advice

        })


    except Exception as e:

        print(
            "CUSTOMER PREDICTION ERROR:",
            str(e)
        )

        return jsonify({

            "success":
                False,

            "error":
                str(e)

        }), 500


# ============================================================
# 10.5. SEND ASSESSMENT RESULT TO CUSTOMER EMAIL
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

        # --------------------------------------------------------
        # CREATE EMAIL
        # --------------------------------------------------------

        message = EmailMessage()

        message["Subject"] = (
            "CreditGuard AI – Your Credit Risk Assessment Result"
        )

        message["From"] = MAIL_USERNAME
        message["To"] = customer_email

        # --------------------------------------------------------
        # EMAIL CONTENT
        # --------------------------------------------------------

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

        # --------------------------------------------------------
        # SHAP EXPLANATION
        # --------------------------------------------------------

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


        # --------------------------------------------------------
        # IMPROVEMENT ADVICE
        # --------------------------------------------------------

        email_body += """

============================================================
HOW YOU CAN IMPROVE YOUR CREDIT PROFILE
============================================================

"""

        if improvement_advice:

            for index, advice in enumerate(
                improvement_advice,
                start=1
            ):

                email_body += f"{index}. {advice}\n"

        else:

            email_body += """
Continue maintaining timely payments and healthy financial
management.
"""


        # --------------------------------------------------------
        # FINAL MESSAGE
        # --------------------------------------------------------

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

        message.set_content(email_body)

        # --------------------------------------------------------
        # SEND EMAIL USING GMAIL SMTP
        # --------------------------------------------------------

        with smtplib.SMTP("smtp.gmail.com", 587) as server:

            server.starttls()

            server.login(
                MAIL_USERNAME,
                MAIL_PASSWORD
            )

            server.send_message(message)


        return jsonify({

            "success": True,

            "message":
                "Assessment result sent successfully to customer"

        })


    except Exception as e:

        print(
            "EMAIL SENDING ERROR:",
            str(e)
        )

        return jsonify({

            "success": False,

            "error":
                str(e)

        }), 500        
# ============================================================
# 11. EMPLOYEE - GET STORED ASSESSMENTS
# ============================================================

@app.route("/employee/assessments", methods=["GET"])
def get_employee_assessments():

    try:

        connection = get_connection()
        cursor = connection.cursor()

        cursor.execute("""
            SELECT
                assessments.id,
                customers.name,
                customers.email,
                assessments.decision,
                assessments.risk_label,
                assessments.risk_score,
                assessments.good_credit_probability,
                assessments.poor_credit_probability,
                assessments.created_at
            FROM assessments
            JOIN customers
            ON assessments.customer_id = customers.id
            ORDER BY assessments.created_at DESC
        """)

        rows = cursor.fetchall()

        connection.close()

        assessments = []

        for row in rows:

            assessments.append({

                "id": row["id"],

                "customer_name":
                    row["name"],

                "customer_email":
                    row["email"],

                "decision":
                    row["decision"],

                "risk_label":
                    row["risk_label"],

                "risk_score":
                    row["risk_score"],

                "good_credit_probability":
                    row["good_credit_probability"],

                "poor_credit_probability":
                    row["poor_credit_probability"],

                "created_at":
                    row["created_at"]
            })

        return jsonify({

            "success": True,

            "assessments":
                assessments

        })

    except Exception as e:

        print(
            "ASSESSMENT HISTORY ERROR:",
            str(e)
        )

        return jsonify({

            "success": False,

            "error":
                str(e)

        }), 500

# ============================================================
# 12. START SERVER
# ============================================================

if __name__ == "__main__":

    app.run(
        host="127.0.0.1",
        port=5000,
        debug=True
    )