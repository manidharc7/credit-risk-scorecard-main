import { useState } from "react";
import { useNavigate } from "react-router-dom";

function CustomerDashboard() {
  const navigate = useNavigate();

  const user = JSON.parse(
    localStorage.getItem("user") || "{}"
  );

  const [formData, setFormData] = useState({
    age: "",
    sex: "male",
    employment_type: "salaried",
    employment_years: "",
    monthly_income: "",
    cibil_score: "",
    past_loans: "",
    on_time_payments: "",
    late_payments: "",
    defaults: "",
    existing_loans: "",
    existing_emi: "",
    credit_utilization: "",
    dti_ratio: "",
    bank_balance: "",
    savings_balance: "",
    new_loan_amount: "",
    loan_duration_months: "",
    loan_purpose: "home",
    identity_verified: 1,
    address_verified: 1,
    employment_verified: 1,
    background_verified: 1,
    collateral_available: 1,
  });

  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const assessRisk = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch(
        "http://127.0.0.1:5000/customer/predict",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...formData,

            age: Number(formData.age),
            employment_years: Number(formData.employment_years),
            monthly_income: Number(formData.monthly_income),
            cibil_score: Number(formData.cibil_score),
            past_loans: Number(formData.past_loans),
            on_time_payments: Number(formData.on_time_payments),
            late_payments: Number(formData.late_payments),
            defaults: Number(formData.defaults),
            existing_loans: Number(formData.existing_loans),
            existing_emi: Number(formData.existing_emi),
            credit_utilization: Number(formData.credit_utilization),
            dti_ratio: Number(formData.dti_ratio),
            bank_balance: Number(formData.bank_balance),
            savings_balance: Number(formData.savings_balance),
            new_loan_amount: Number(formData.new_loan_amount),
            loan_duration_months: Number(
              formData.loan_duration_months
            ),
            identity_verified: Number(
              formData.identity_verified
            ),
            address_verified: Number(
              formData.address_verified
            ),
            employment_verified: Number(
              formData.employment_verified
            ),
            background_verified: Number(
              formData.background_verified
            ),
            collateral_available: Number(
              formData.collateral_available
            ),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Assessment failed"
        );
      }

      setResult(data);

      setTimeout(() => {
        document
          .getElementById("customer-result")
          ?.scrollIntoView({
            behavior: "smooth",
          });
      }, 200);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  const featureNames = {
    age: "Age",
    sex: "Gender",
    employment_type: "Employment Type",
    employment_years: "Employment Stability",
    monthly_income: "Monthly Income",
    cibil_score: "CIBIL Score",
    past_loans: "Past Loan History",
    on_time_payments: "On-Time Payments",
    late_payments: "Late Payments",
    defaults: "Loan Defaults",
    existing_loans: "Existing Loans",
    existing_emi: "Existing EMI",
    credit_utilization: "Credit Utilization",
    dti_ratio: "Debt-to-Income Ratio",
    bank_balance: "Bank Balance",
    savings_balance: "Savings Balance",
    new_loan_amount: "Requested Loan Amount",
    loan_duration_months: "Loan Duration",
    loan_purpose: "Loan Purpose",
    identity_verified: "Identity Verification",
    address_verified: "Address Verification",
    employment_verified: "Employment Verification",
    background_verified: "Background Verification",
    collateral_available: "Collateral Availability",
  };

  return (
    <div className="customer-page">

      {/* =====================================================
          NAVBAR
      ===================================================== */}

      <header className="navbar">

        <div className="brand">

          <div className="brand-icon">
            CG
          </div>

          <div>

            <div className="logo">
              CreditGuard <span>AI</span>
            </div>

            <div className="nav-subtitle">
              Customer Portal
            </div>

          </div>

        </div>

        <div className="customer-nav">

          <span>
            Welcome, {user.name || "Customer"}
          </span>

          <button onClick={logout}>
            Logout
          </button>

        </div>

      </header>


      {/* =====================================================
          MAIN
      ===================================================== */}

      <main className="customer-container">


        {/* ===================================================
            HERO
        =================================================== */}

        <section className="customer-hero">

          <span className="eyebrow">
            PERSONAL CREDIT ASSESSMENT
          </span>

          <h1>
            Check Your
            <span> Credit Risk</span>
          </h1>

          <p>
            Enter your financial information to
            understand your credit risk and discover
            ways to improve your credit profile.
          </p>

        </section>


        {/* ===================================================
            FORM
        =================================================== */}

        <section className="card customer-form-card">

          <div className="section-heading">

            <div>

              <span className="section-number">
                01
              </span>

              <div>

                <h2>
                  Your Financial Information
                </h2>

                <p>
                  Enter accurate information for a
                  better assessment.
                </p>

              </div>

            </div>

          </div>


          <form onSubmit={assessRisk}>


            {/* PERSONAL & EMPLOYMENT */}

            <div className="form-section">

              <h3>
                Personal & Employment
              </h3>

              <div className="form-grid three">

                <div className="field">

                  <label>
                    Age
                  </label>

                  <input
                    type="number"
                    name="age"
                    min="21"
                    max="65"
                    value={formData.age}
                    onChange={handleChange}
                    required
                  />

                </div>


                <div className="field">

                  <label>
                    Sex
                  </label>

                  <select
                    name="sex"
                    value={formData.sex}
                    onChange={handleChange}
                  >

                    <option value="male">
                      Male
                    </option>

                    <option value="female">
                      Female
                    </option>

                  </select>

                </div>


                <div className="field">

                  <label>
                    Employment Type
                  </label>

                  <select
                    name="employment_type"
                    value={formData.employment_type}
                    onChange={handleChange}
                  >

                    <option value="salaried">
                      Salaried
                    </option>

                    <option value="business">
                      Business
                    </option>

                    <option value="self_employed">
                      Self Employed
                    </option>

                    <option value="contract">
                      Contract
                    </option>

                    <option value="unemployed">
                      Unemployed
                    </option>

                  </select>

                </div>


                <div className="field">

                  <label>
                    Employment Years
                  </label>

                  <input
                    type="number"
                    name="employment_years"
                    step="0.1"
                    min="0"
                    value={formData.employment_years}
                    onChange={handleChange}
                    required
                  />

                </div>


                <div className="field">

                  <label>
                    Monthly Income (₹)
                  </label>

                  <input
                    type="number"
                    name="monthly_income"
                    min="0"
                    value={formData.monthly_income}
                    onChange={handleChange}
                    required
                  />

                </div>

              </div>

            </div>


            {/* CREDIT HISTORY */}

            <div className="form-section">

              <h3>
                Credit History
              </h3>

              <div className="form-grid three">

                <div className="field">

                  <label>
                    CIBIL Score
                  </label>

                  <input
                    type="number"
                    name="cibil_score"
                    min="300"
                    max="900"
                    value={formData.cibil_score}
                    onChange={handleChange}
                    required
                  />

                </div>


                <div className="field">

                  <label>
                    Past Loans
                  </label>

                  <input
                    type="number"
                    name="past_loans"
                    min="0"
                    value={formData.past_loans}
                    onChange={handleChange}
                    required
                  />

                </div>


                <div className="field">

                  <label>
                    Existing Loans
                  </label>

                  <input
                    type="number"
                    name="existing_loans"
                    min="0"
                    value={formData.existing_loans}
                    onChange={handleChange}
                    required
                  />

                </div>


                <div className="field">

                  <label>
                    On-Time Payments
                  </label>

                  <input
                    type="number"
                    name="on_time_payments"
                    min="0"
                    value={formData.on_time_payments}
                    onChange={handleChange}
                    required
                  />

                </div>


                <div className="field">

                  <label>
                    Late Payments
                  </label>

                  <input
                    type="number"
                    name="late_payments"
                    min="0"
                    value={formData.late_payments}
                    onChange={handleChange}
                    required
                  />

                </div>


                <div className="field">

                  <label>
                    Defaults
                  </label>

                  <input
                    type="number"
                    name="defaults"
                    min="0"
                    value={formData.defaults}
                    onChange={handleChange}
                    required
                  />

                </div>

              </div>

            </div>


            {/* FINANCIAL HEALTH */}

            <div className="form-section">

              <h3>
                Financial Health
              </h3>

              <div className="form-grid three">

                <div className="field">

                  <label>
                    Existing EMI (₹)
                  </label>

                  <input
                    type="number"
                    name="existing_emi"
                    min="0"
                    value={formData.existing_emi}
                    onChange={handleChange}
                    required
                  />

                </div>


                <div className="field">

                  <label>
                    Credit Utilization
                  </label>

                  <input
                    type="number"
                    name="credit_utilization"
                    min="0"
                    max="1"
                    step="0.01"
                    value={formData.credit_utilization}
                    onChange={handleChange}
                    placeholder="0.30"
                    required
                  />

                </div>


                <div className="field">

                  <label>
                    DTI Ratio
                  </label>

                  <input
                    type="number"
                    name="dti_ratio"
                    min="0"
                    max="1"
                    step="0.01"
                    value={formData.dti_ratio}
                    onChange={handleChange}
                    placeholder="0.25"
                    required
                  />

                </div>


                <div className="field">

                  <label>
                    Bank Balance (₹)
                  </label>

                  <input
                    type="number"
                    name="bank_balance"
                    min="0"
                    value={formData.bank_balance}
                    onChange={handleChange}
                    required
                  />

                </div>


                <div className="field">

                  <label>
                    Savings Balance (₹)
                  </label>

                  <input
                    type="number"
                    name="savings_balance"
                    min="0"
                    value={formData.savings_balance}
                    onChange={handleChange}
                    required
                  />

                </div>

              </div>

            </div>


            {/* NEW LOAN */}

            <div className="form-section">

              <h3>
                New Loan Details
              </h3>

              <div className="form-grid three">

                <div className="field">

                  <label>
                    New Loan Amount (₹)
                  </label>

                  <input
                    type="number"
                    name="new_loan_amount"
                    min="0"
                    value={formData.new_loan_amount}
                    onChange={handleChange}
                    required
                  />

                </div>


                <div className="field">

                  <label>
                    Loan Duration (Months)
                  </label>

                  <input
                    type="number"
                    name="loan_duration_months"
                    min="1"
                    value={formData.loan_duration_months}
                    onChange={handleChange}
                    required
                  />

                </div>


                <div className="field">

                  <label>
                    Loan Purpose
                  </label>

                  <select
                    name="loan_purpose"
                    value={formData.loan_purpose}
                    onChange={handleChange}
                  >

                    <option value="home">
                      Home
                    </option>

                    <option value="car">
                      Car
                    </option>

                    <option value="education">
                      Education
                    </option>

                    <option value="business">
                      Business
                    </option>

                    <option value="personal">
                      Personal
                    </option>

                    <option value="medical">
                      Medical
                    </option>

                  </select>

                </div>

              </div>

            </div>


            {/* SUBMIT */}

            <button
              type="submit"
              className="assess-button"
              disabled={loading}
            >

              {loading
                ? "Analyzing Your Profile..."
                : "Check My Credit Risk →"}

            </button>

          </form>

        </section>


        {/* ERROR */}

        {error && (

          <div className="error">

            <strong>
              Assessment Error
            </strong>

            <span>
              {error}
            </span>

          </div>

        )}


        {/* =================================================
            RESULT
        ================================================= */}

        {result && (

          <section
            id="customer-result"
            className="customer-result"
          >


            {/* RESULT HEADER */}

            <div className="customer-result-header">

              <span className="eyebrow">
                YOUR ASSESSMENT
              </span>

              <h2>
                Credit Risk Result
              </h2>

            </div>


            {/* SCORE CARD */}

            <div className="customer-score-card">

              <div>

                <span>
                  Credit Risk Score
                </span>

                <div className="customer-score">

                  {result.credit_score}

                  <small>
                    /100
                  </small>

                </div>

              </div>


              <div>

                <h3>
                  {result.decision}
                </h3>

                <p>
                  {result.risk_label}
                </p>

              </div>

            </div>


            {/* RESULT GRID */}

            <div className="customer-result-grid">


              {/* RISK PROBABILITY */}

              <div className="dashboard-card">

                <h3>
                  Risk Probability
                </h3>

                <p>
                  Good Credit:{" "}
                  <strong>
                    {result.good_credit_probability}%
                  </strong>
                </p>

                <p>
                  Poor Credit:{" "}
                  <strong>
                    {result.poor_credit_probability}%
                  </strong>
                </p>

              </div>


              {/* EXPLANATION */}

              <div className="dashboard-card">

                <h3>
                  Why did I get this result?
                </h3>

                <div className="customer-explanations">

                  {result.explanation?.map(
                    (item, index) => {

                      const reducesRisk =
                        item.direction ===
                        "reduces_risk";

                      const displayName =
                        featureNames[item.feature] ||
                        item.feature
                          .replaceAll("_", " ")
                          .replace(
                            /\b\w/g,
                            (char) =>
                              char.toUpperCase()
                          );

                      return (

                        <div
                          key={index}
                          className={`customer-explanation ${
                            reducesRisk
                              ? "positive-factor"
                              : "risk-factor"
                          }`}
                        >

                          <div>

                            <strong>
                              {displayName}
                            </strong>

                            <p>
                                {item.reason}
                            </p>

                          </div>

                          <span>
                            {reducesRisk
                              ? "Positive"
                              : "Risk Factor"}
                          </span>

                        </div>

                      );

                    }
                  )}

                </div>

              </div>

            </div>


            {/* PERSONALIZED ADVICE */}

            <div className="dashboard-card advice-card">

              <h3>
                How can I improve my credit profile?
              </h3>

              {result.risk_label ===
              "HIGHER RISK" ? (

                <div className="advice-list">

                  {result.improvement_advice?.map(
                    (advice, index) => (

                      <div key={index}>

                        <strong>
                          {index + 1}.
                          {" "}
                          Improvement Recommendation
                        </strong>

                        <p>
                          {advice}
                        </p>

                      </div>

                    )
                  )}

                </div>

              ) : (

                <p>

                  Your current profile shows a lower
                  level of credit risk. Continue making
                  payments on time and maintaining
                  healthy financial habits.

                </p>

              )}

            </div>


            {/* DISCLAIMER */}

            <div className="customer-disclaimer">

              <strong>
                Important
              </strong>

              <p>

                This is an AI-based credit risk
                assessment and does not represent a
                final loan approval or rejection.

              </p>

            </div>

          </section>

        )}

      </main>

    </div>
  );
}

export default CustomerDashboard;