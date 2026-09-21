import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../App.css";

function App() {  
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user") || "null");

  const employeeName =
    user?.name ||
    user?.employee_name ||
    user?.username ||
    user?.employee_id ||
    "Employee";

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/employee-login");
  };
  const [formData, setFormData] = useState({
    customerName: "",
    customerEmail: "",

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailStatus, setEmailStatus] = useState("");

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
        "http://127.0.0.1:5000/predict",
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

            credit_utilization:
              Number(formData.credit_utilization),

            dti_ratio:
              Number(formData.dti_ratio),

            bank_balance:
              Number(formData.bank_balance),

            savings_balance:
              Number(formData.savings_balance),

            new_loan_amount:
              Number(formData.new_loan_amount),

            loan_duration_months:
              Number(formData.loan_duration_months),

            identity_verified:
              Number(formData.identity_verified),

            address_verified:
              Number(formData.address_verified),

            employment_verified:
              Number(formData.employment_verified),

            background_verified:
              Number(formData.background_verified),

            collateral_available:
              Number(formData.collateral_available),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Prediction failed"
        );
      }

      setResult(data);

      // Scroll to result after prediction
      setTimeout(() => {
        document
          .getElementById("assessment-result")
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
  const sendResultToCustomer = async () => {
    if (!result) return;

    setSendingEmail(true);
    setEmailStatus("");
    setError("");

    try {
      const response = await fetch(
        "http://127.0.0.1:5000/send-result",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            customerName: result.customer?.name,
            customerEmail: result.customer?.email,

            decision: result.decision,
            risk_label: result.risk_label,
            credit_score: result.credit_score,

            good_credit_probability:
              result.good_credit_probability,

            poor_credit_probability:
              result.poor_credit_probability,

            explanation:
              result.explanation || [],

            improvement_advice:
              result.improvement_advice || [],
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to send email"
        );
      }

      setEmailStatus(
        "✓ Assessment result sent successfully to customer."
      );

    } catch (err) {

      setEmailStatus(
        "✕ Failed to send email: " + err.message
      );

    } finally {

      setSendingEmail(false);

    }
  };

  const getRiskClass = () => {
    if (!result) return "";

    if (result.risk_label === "LOWER RISK") {
      return "risk-good";
    }

    return "risk-high";
  };

  const getCibilClass = () => {
    const score = Number(formData.cibil_score);

    if (score >= 750) return "score-good";
    if (score >= 650) return "score-medium";

    return "score-poor";
  };

  const getVerificationCount = () => {
    return [
      Number(formData.identity_verified),
      Number(formData.address_verified),
      Number(formData.employment_verified),
      Number(formData.background_verified),
    ].filter(Boolean).length;
  };

  return (
    <div className="app">

      {/* ==================================================
          NAVBAR
      ================================================== */}

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
              Intelligent Credit Risk Platform
            </div>
          </div>
        </div>

        <div className="navbar-right">

          <div className="employee-info">
            <span className="employee-icon">👤</span>

            <div>
              <strong>{employeeName}</strong>
              <small>Employee</small>
            </div>
          </div>

          <button
            className="logout-button"
            onClick={handleLogout}
          >
            Logout
          </button>

          <div className="system-status">
            <span className="status-dot"></span>
            AI Model Online
          </div>

        </div>

      </header>


      <main className="container">

        {/* ==================================================
            HERO
        ================================================== */}

        <section className="hero">

          <div className="hero-content">

            <span className="eyebrow">
              AI-POWERED CREDIT ASSESSMENT
            </span>

            <h1>
              Credit Risk
              <span> Assessment</span>
            </h1>

            <p>
              Analyze customer creditworthiness using
              CIBIL score, payment history, financial
              behavior, verification checks and an
              explainable XGBoost model.
            </p>

          </div>

          <div className="hero-badge">

            <div className="pulse-circle">
              AI
            </div>

            <div>
              <strong>XGBoost</strong>
              <small>Explainable ML</small>
            </div>

          </div>

        </section>


        {/* ==================================================
            CUSTOMER FORM
        ================================================== */}

        <section className="card form-card">

          <div className="section-heading">

            <div>
              <span className="section-number">
                01
              </span>

              <div>
                <h2>Customer Information</h2>

                <p>
                  Enter the customer's financial and
                  verification information.
                </p>
              </div>
            </div>

          </div>


          <form onSubmit={assessRisk}>

            {/* CUSTOMER IDENTITY */}

            <div className="form-section">

              <h3>
                Customer Identity
              </h3>

              <div className="form-grid two">

                <div className="field">

                  <label>
                    Customer Name
                  </label>

                  <input
                    type="text"
                    name="customerName"
                    value={formData.customerName}
                    onChange={handleChange}
                    placeholder="Enter customer name"
                    required
                  />

                </div>


                <div className="field">

                  <label>
                    Customer Gmail
                  </label>

                  <input
                    type="email"
                    name="customerEmail"
                    value={formData.customerEmail}
                    onChange={handleChange}
                    placeholder="customer@gmail.com"
                    required
                  />

                </div>

              </div>

            </div>


            {/* PERSONAL + EMPLOYMENT */}

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
                    placeholder="30"
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
                    placeholder="5.5"
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
                    placeholder="60000"
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
                    placeholder="750"
                    required
                  />

                  <small className="field-hint">
                    Actual customer CIBIL score
                  </small>

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
                    placeholder="3"
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
                    placeholder="1"
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
                    placeholder="50"
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
                    placeholder="2"
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
                    placeholder="0"
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
                    placeholder="8000"
                    required
                  />

                </div>


                <div className="field">

                  <label>
                    Credit Utilization (%)
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

                  <small className="field-hint">
                    Enter 0.30 for 30%
                  </small>

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

                  <small className="field-hint">
                    Enter 0.25 for 25%
                  </small>

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
                    placeholder="250000"
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
                    placeholder="100000"
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
                    placeholder="300000"
                    required
                  />

                </div>


                <div className="field">

                  <label>
                    Loan Duration
                  </label>

                  <input
                    type="number"
                    name="loan_duration_months"
                    min="1"
                    value={formData.loan_duration_months}
                    onChange={handleChange}
                    placeholder="36"
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


            {/* VERIFICATION */}

            <div className="form-section">

              <div className="verification-heading">

                <div>
                  <h3>
                    Verification & Security
                  </h3>

                  <p>
                    Confirm customer verification checks.
                  </p>
                </div>

                <div className="verification-count">
                  {getVerificationCount()}/4 Verified
                </div>

              </div>


              <div className="verification-grid">

                <label className="verification-item">

                  <input
                    type="checkbox"
                    checked={
                      Number(formData.identity_verified) === 1
                    }
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        identity_verified:
                          e.target.checked ? 1 : 0,
                      })
                    }
                  />

                  <span>
                    Identity Verified
                  </span>

                </label>


                <label className="verification-item">

                  <input
                    type="checkbox"
                    checked={
                      Number(formData.address_verified) === 1
                    }
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        address_verified:
                          e.target.checked ? 1 : 0,
                      })
                    }
                  />

                  <span>
                    Address Verified
                  </span>

                </label>


                <label className="verification-item">

                  <input
                    type="checkbox"
                    checked={
                      Number(formData.employment_verified) === 1
                    }
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        employment_verified:
                          e.target.checked ? 1 : 0,
                      })
                    }
                  />

                  <span>
                    Employment Verified
                  </span>

                </label>


                <label className="verification-item">

                  <input
                    type="checkbox"
                    checked={
                      Number(formData.background_verified) === 1
                    }
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        background_verified:
                          e.target.checked ? 1 : 0,
                      })
                    }
                  />

                  <span>
                    Background Verified
                  </span>

                </label>


                <label className="verification-item">

                  <input
                    type="checkbox"
                    checked={
                      Number(formData.collateral_available) === 1
                    }
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        collateral_available:
                          e.target.checked ? 1 : 0,
                      })
                    }
                  />

                  <span>
                    Collateral Available
                  </span>

                </label>

              </div>

            </div>


            <button
              type="submit"
              className="assess-button"
              disabled={loading}
            >

              {loading ? (
                <>
                  <span className="spinner"></span>
                  Analyzing Customer...
                </>
              ) : (
                <>
                  Assess Credit Risk
                  <span>→</span>
                </>
              )}

            </button>

          </form>

        </section>
        <button
          type="button"
          className="assess-button"
          onClick={() => {
            window.location.hash = "/employee-history";
          }}
          style={{
            marginTop: "15px",
          }}
        >
          View Customer History →
        </button>


        {/* ==================================================
            ERROR
        ================================================== */}

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


        {/* ==================================================
            DASHBOARD RESULT
        ================================================== */}

        {result && (

          <section
            id="assessment-result"
            className="dashboard-result"
          >

            {/* RESULT HEADER */}

            <div className="result-header">

              <div>

                <span className="eyebrow">
                  ASSESSMENT COMPLETE
                </span>

                <h2>
                  Credit Health Dashboard
                </h2>

                <p>
                  AI assessment for{" "}
                  <strong>
                    {result.customer?.name}
                  </strong>
                </p>

              </div>


              <div className="customer-email">
                ✉ {result.customer?.email}
              </div>

            </div>


            {/* MAIN SCORE CARDS */}

            <div className="metrics-grid">

              {/* DECISION */}

              <div
                className={`metric-card decision-card ${getRiskClass()}`}
              >

                <div className="metric-top">

                  <span>
                    AI Decision
                  </span>

                  <span className="metric-icon">
                    ◉
                  </span>

                </div>

                <h3>
                  {result.decision}
                </h3>

                <p>
                  {result.risk_label}
                </p>

              </div>


              {/* AI RISK SCORE */}

              <div className="metric-card">

                <div className="metric-top">

                  <span>
                    AI Risk Score
                  </span>

                  <span className="metric-icon">
                    ◈
                  </span>

                </div>

                <div className="score-number">

                  {result.credit_score}

                  <small>
                    /100
                  </small>

                </div>

                <div className="progress-track">

                  <div
                    className="progress-fill"
                    style={{
                      width:
                        `${result.credit_score}%`,
                    }}
                  ></div>

                </div>

                <p>
                  Model confidence score
                </p>

              </div>


              {/* CIBIL */}

              <div className="metric-card">

                <div className="metric-top">

                  <span>
                    CIBIL Score
                  </span>

                  <span className="metric-icon">
                    ★
                  </span>

                </div>

                <div
                  className={`score-number ${getCibilClass()}`}
                >

                  {formData.cibil_score}

                  <small>
                    /900
                  </small>

                </div>

                <p>
                  Customer's actual CIBIL score
                </p>

              </div>


              {/* POOR CREDIT PROBABILITY */}

              <div className="metric-card">

                <div className="metric-top">

                  <span>
                    Poor Credit Probability
                  </span>

                  <span className="metric-icon">
                    !
                  </span>

                </div>

                <div className="score-number">

                  {result.poor_credit_probability}

                  <small>
                    %
                  </small>

                </div>

                <div className="progress-track">

                  <div
                    className="progress-fill danger"
                    style={{
                      width:
                        `${result.poor_credit_probability}%`,
                    }}
                  ></div>

                </div>

                <p>
                  Probability predicted by XGBoost
                </p>

              </div>

            </div>


            {/* CHART AREA */}

            <div className="dashboard-grid">


              {/* PROBABILITY CHART */}

              <div className="dashboard-card">

                <div className="dashboard-card-header">

                  <div>

                    <h3>
                      Risk Probability
                    </h3>

                    <p>
                      Model prediction distribution
                    </p>

                  </div>

                </div>


                <div className="probability-chart">

                  <div className="probability-item">

                    <div className="probability-label">

                      <span>
                        Good Credit
                      </span>

                      <strong>
                        {result.good_credit_probability}%
                      </strong>

                    </div>

                    <div className="chart-track">

                      <div
                        className="chart-bar good"
                        style={{
                          width:
                            `${result.good_credit_probability}%`,
                        }}
                      ></div>

                    </div>

                  </div>


                  <div className="probability-item">

                    <div className="probability-label">

                      <span>
                        Poor Credit
                      </span>

                      <strong>
                        {result.poor_credit_probability}%
                      </strong>

                    </div>

                    <div className="chart-track">

                      <div
                        className="chart-bar poor"
                        style={{
                          width:
                            `${result.poor_credit_probability}%`,
                        }}
                      ></div>

                    </div>

                  </div>

                </div>

              </div>


              {/* FINANCIAL PROFILE */}

              <div className="dashboard-card">

                <div className="dashboard-card-header">

                  <div>

                    <h3>
                      Financial Profile
                    </h3>

                    <p>
                      Key customer indicators
                    </p>

                  </div>

                </div>


                <div className="financial-bars">

                  <div className="financial-row">

                    <span>
                      Monthly Income
                    </span>

                    <strong>
                      ₹{Number(
                        formData.monthly_income
                      ).toLocaleString()}
                    </strong>

                  </div>


                  <div className="financial-row">

                    <span>
                      Bank Balance
                    </span>

                    <strong>
                      ₹{Number(
                        formData.bank_balance
                      ).toLocaleString()}
                    </strong>

                  </div>


                  <div className="financial-row">

                    <span>
                      Savings
                    </span>

                    <strong>
                      ₹{Number(
                        formData.savings_balance
                      ).toLocaleString()}
                    </strong>

                  </div>


                  <div className="financial-row">

                    <span>
                      Existing EMI
                    </span>

                    <strong>
                      ₹{Number(
                        formData.existing_emi
                      ).toLocaleString()}
                    </strong>

                  </div>

                </div>

              </div>

            </div>


            {/* CREDIT BEHAVIOR */}

            <div className="dashboard-grid">

              <div className="dashboard-card">

                <div className="dashboard-card-header">

                  <div>

                    <h3>
                      Payment Behavior
                    </h3>

                    <p>
                      Historical loan repayment profile
                    </p>

                  </div>

                </div>


                <div className="behavior-chart">

                  <div className="behavior-column">

                    <div
                      className="vertical-bar ontime"
                      style={{
                        height:
                          `${Math.min(
                            Number(
                              formData.on_time_payments
                            ) * 4,
                            150
                          )}px`,
                      }}
                    ></div>

                    <strong>
                      {formData.on_time_payments}
                    </strong>

                    <span>
                      On Time
                    </span>

                  </div>


                  <div className="behavior-column">

                    <div
                      className="vertical-bar late"
                      style={{
                        height:
                          `${Math.min(
                            Number(
                              formData.late_payments
                            ) * 10,
                            150
                          )}px`,
                      }}
                    ></div>

                    <strong>
                      {formData.late_payments}
                    </strong>

                    <span>
                      Late
                    </span>

                  </div>


                  <div className="behavior-column">

                    <div
                      className="vertical-bar defaults"
                      style={{
                        height:
                          `${Math.max(
                            Number(
                              formData.defaults
                            ) * 30,
                            8
                          )}px`,
                      }}
                    ></div>

                    <strong>
                      {formData.defaults}
                    </strong>

                    <span>
                      Defaults
                    </span>

                  </div>


                  <div className="behavior-column">

                    <div
                      className="vertical-bar loans"
                      style={{
                        height:
                          `${Math.min(
                            Number(
                              formData.past_loans
                            ) * 25,
                            150
                          )}px`,
                      }}
                    ></div>

                    <strong>
                      {formData.past_loans}
                    </strong>

                    <span>
                      Past Loans
                    </span>

                  </div>

                </div>

              </div>


              {/* VERIFICATION STATUS */}

              <div className="dashboard-card">

                <div className="dashboard-card-header">

                  <div>

                    <h3>
                      Verification Status
                    </h3>

                    <p>
                      Customer due-diligence checks
                    </p>

                  </div>

                  <div className="verification-score">
                    {getVerificationCount()}/4
                  </div>

                </div>


                <div className="verification-list">

                  <div className="status-row">

                    <span>
                      Identity
                    </span>

                    <strong className={
                      Number(formData.identity_verified)
                        ? "verified"
                        : "not-verified"
                    }>
                      {Number(
                        formData.identity_verified
                      )
                        ? "✓ Verified"
                        : "✕ Not Verified"}
                    </strong>

                  </div>


                  <div className="status-row">

                    <span>
                      Address
                    </span>

                    <strong className={
                      Number(formData.address_verified)
                        ? "verified"
                        : "not-verified"
                    }>
                      {Number(
                        formData.address_verified
                      )
                        ? "✓ Verified"
                        : "✕ Not Verified"}
                    </strong>

                  </div>


                  <div className="status-row">

                    <span>
                      Employment
                    </span>

                    <strong className={
                      Number(formData.employment_verified)
                        ? "verified"
                        : "not-verified"
                    }>
                      {Number(
                        formData.employment_verified
                      )
                        ? "✓ Verified"
                        : "✕ Not Verified"}
                    </strong>

                  </div>


                  <div className="status-row">

                    <span>
                      Background
                    </span>

                    <strong className={
                      Number(formData.background_verified)
                        ? "verified"
                        : "not-verified"
                    }>
                      {Number(
                        formData.background_verified
                      )
                        ? "✓ Verified"
                        : "✕ Not Verified"}
                    </strong>

                  </div>

                </div>

              </div>

            </div>

            {/* EMAIL RESULT */}

            <div
              style={{
                marginTop: "25px",
                marginBottom: "25px",
                textAlign: "center",
              }}
            >
              <button
                type="button"
                className="assess-button"
                onClick={sendResultToCustomer}
                disabled={sendingEmail}
              >
                {sendingEmail
                  ? "📧 Sending Email..."
                  : "📧 Send Result to Customer"}
              </button>

              {emailStatus && (
                <p
                  style={{
                    marginTop: "12px",
                    fontWeight: "600",
                  }}
                >
                  {emailStatus}
                </p>
              )}
            </div>


            {/* SHAP EXPLANATION */}

            <div className="dashboard-card shap-card">

              <div className="dashboard-card-header">

                <div>

                  <span className="ai-tag">
                    EXPLAINABLE AI
                  </span>

                  <h3>
                    Why did the model make this decision?
                  </h3>

                  <p>
                    SHAP shows which features influenced
                    the XGBoost prediction.
                  </p>

                </div>

              </div>


              <div className="shap-list">

                {result.explanation?.map(
                  (item, index) => {

                    const magnitude =
                      Math.min(
                        Math.abs(
                          Number(item.impact)
                        ) * 35,
                        100
                      );

                    const reducesRisk =
                      item.direction ===
                      "reduces_risk";

                    return (

                      <div
                        className="shap-row"
                        key={index}
                      >

                        <div className="shap-rank">
                          {index + 1}
                        </div>


                        <div className="shap-feature">

                          <div className="shap-feature-name">
                            {item.feature}
                          </div>

                          <div className="shap-track">

                            <div
                              className={
                                `shap-bar ${
                                  reducesRisk
                                    ? "positive"
                                    : "negative"
                                }`
                              }
                              style={{
                                width:
                                  `${magnitude}%`,
                              }}
                            ></div>

                          </div>

                        </div>


                        <div
                          className={
                            `shap-impact ${
                              reducesRisk
                                ? "positive-text"
                                : "negative-text"
                            }`
                          }
                        >

                          {Number(item.impact) > 0
                            ? "+"
                            : ""}

                          {Number(
                            item.impact
                          ).toFixed(3)}

                        </div>


                        <div className="shap-direction">

                          {reducesRisk
                            ? "↓ Lower Risk"
                            : "↑ Higher Risk"}

                        </div>

                      </div>

                    );
                  }
                )}

              </div>

            </div>


            {/* FOOTER NOTE */}

            <div className="model-note">

              <div className="model-note-icon">
                ✦
              </div>

              <div>

                <strong>
                  Explainable AI Assessment
                </strong>

                <p>
                  This assessment combines customer
                  financial information, credit history,
                  verification data and an XGBoost model.
                  SHAP provides feature-level explanations
                  for the prediction.
                </p>

              </div>

            </div>

          </section>
        )}

      </main>

    </div>
  );
}

export default App;