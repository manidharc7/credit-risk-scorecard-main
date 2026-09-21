import sqlite3

DATABASE = "creditguard.db"


def get_connection():
    connection = sqlite3.connect(DATABASE)
    connection.row_factory = sqlite3.Row
    return connection


def init_database():

    connection = get_connection()
    cursor = connection.cursor()

    # ============================================================
    # USERS - Employee and Customer Login
    # ============================================================

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,

            name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            phone TEXT NOT NULL,
            username TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,

            role TEXT NOT NULL,

            employee_id TEXT UNIQUE,

            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # ============================================================
    # CUSTOMER INFORMATION
    # ============================================================

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS customers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # ============================================================
    # COMPLETE CREDIT ASSESSMENT
    # ============================================================

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS assessments (

            id INTEGER PRIMARY KEY AUTOINCREMENT,

            customer_id INTEGER,

            age INTEGER,
            sex TEXT,
            employment_type TEXT,
            employment_years REAL,

            monthly_income REAL,
            cibil_score INTEGER,

            past_loans INTEGER,
            on_time_payments INTEGER,
            late_payments INTEGER,
            defaults INTEGER,

            existing_loans INTEGER,
            existing_emi REAL,

            credit_utilization REAL,
            dti_ratio REAL,

            bank_balance REAL,
            savings_balance REAL,

            new_loan_amount REAL,
            loan_duration_months INTEGER,
            loan_purpose TEXT,

            identity_verified INTEGER,
            address_verified INTEGER,
            employment_verified INTEGER,
            background_verified INTEGER,
            collateral_available INTEGER,

            decision TEXT,
            risk_label TEXT,
            risk_score INTEGER,

            good_credit_probability REAL,
            poor_credit_probability REAL,

            shap_explanation TEXT,

            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

            FOREIGN KEY (customer_id)
                REFERENCES customers(id)
        )
    """)

    connection.commit()
    connection.close()

    print("CreditGuard database initialized successfully!")


if __name__ == "__main__":
    init_database()