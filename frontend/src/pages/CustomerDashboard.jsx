import { useState } from "react";

import { Sidebar } from "../components/Sidebar";
import { API_BASE_URL } from "../firebase/config";
import { saveAssessment } from "../firebase/assessments";
import { useAuth } from "../context/useAuth";
import { useToast } from "../context/useToast";

function CustomerDashboard() {
  const { user, profile } = useAuth();
  const toast = useToast();

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

    const monthlyIncome = Number(formData.monthly_income);
    const existingEmi = Number(formData.existing_emi);

    // The debt-to-income ratio is a banking term most customers won't
    // know off-hand, but it's just existing monthly loan payments divided
    // by monthly income — so we calculate it instead of asking for it.
    const dtiRatio = monthlyIncome > 0 ? existingEmi / monthlyIncome : 0;

    const payload = {
      ...formData,

      age: Number(formData.age),
      employment_years: Number(formData.employment_years),
      monthly_income: monthlyIncome,
      cibil_score: Number(formData.cibil_score),
      past_loans: Number(formData.past_loans),
      on_time_payments: Number(formData.on_time_payments),
      late_payments: Number(formData.late_payments),
      defaults: Number(formData.defaults),
      existing_loans: Number(formData.existing_loans),
      existing_emi: existingEmi,
      credit_utilization: Number(formData.credit_utilization) / 100,
      dti_ratio: dtiRatio,
      bank_balance: Number(formData.bank_balance),
      savings_balance: Number(formData.savings_balance),
      new_loan_amount: Number(formData.new_loan_amount),
      loan_duration_months: Number(formData.loan_duration_months),
      identity_verified: Number(formData.identity_verified),
      address_verified: Number(formData.address_verified),
      employment_verified: Number(formData.employment_verified),
      background_verified: Number(formData.background_verified),
      collateral_available: Number(formData.collateral_available),
    };

    try {
      const response = await fetch(`${API_BASE_URL}/customer/predict`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Assessment failed");
      }

      setResult(data);

      try {
        await saveAssessment({
          payload,
          apiResult: data,
          customerName: profile?.name || "",
          customerEmail: profile?.email || "",
          customerUid: user.uid,
          performedBy: user.uid,
          source: "self",
        });
      } catch (persistError) {
        toast.error(
          "Report generated, but saving it to your profile failed: " +
            persistError.message
        );
      }

      setTimeout(() => {
        document
          .getElementById("customer-result")
          ?.scrollIntoView({ behavior: "smooth" });
      }, 200);
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
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
      <Sidebar portal="customer" />

      <main className="customer-container">
        <section className="customer-hero">
          <span className="eyebrow">PERSONAL CREDIT ASSESSMENT</span>

          <h1>
            Check Your
            <span> Credit Risk</span>
          </h1>

          <p>
            Answer a few simple questions about your money and job to see
            your credit risk and get tips to improve it. Not sure about a
            term? Each question has a plain-English explanation below it.
          </p>
        </section>

        <section className="card customer-form-card">
          <div className="section-heading">
            <div>
              <span className="section-number">01</span>

              <div>
                <h2>Tell Us About Yourself</h2>
                <p>
                  Rough numbers are fine — this doesn't need to be exact.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={assessRisk}>
            <div className="form-section">
              <h3>About You & Your Job</h3>

              <div className="form-grid three">
                <div className="field">
                  <label>Your Age</label>
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
                  <label>Gender</label>
                  <select name="sex" value={formData.sex} onChange={handleChange}>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>

                <div className="field">
                  <label>How Do You Earn?</label>
                  <select
                    name="employment_type"
                    value={formData.employment_type}
                    onChange={handleChange}
                  >
                    <option value="salaried">Salaried (fixed monthly job)</option>
                    <option value="business">Run a Business</option>
                    <option value="self_employed">Self Employed / Freelance</option>
                    <option value="contract">Contract Worker</option>
                    <option value="unemployed">Not Currently Working</option>
                  </select>
                </div>

                <div className="field">
                  <label>Years at Current Job</label>
                  <input
                    type="number"
                    name="employment_years"
                    step="0.1"
                    min="0"
                    value={formData.employment_years}
                    onChange={handleChange}
                    placeholder="e.g. 2.5"
                    required
                  />
                  <small className="field-hint">
                    How long you've worked at your current job or business.
                  </small>
                </div>

                <div className="field">
                  <label>Monthly Income (₹)</label>
                  <input
                    type="number"
                    name="monthly_income"
                    min="0"
                    value={formData.monthly_income}
                    onChange={handleChange}
                    placeholder="e.g. 45000"
                    required
                  />
                  <small className="field-hint">
                    Your take-home pay each month, before EMIs are deducted.
                  </small>
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3>Your Credit History</h3>

              <div className="form-grid three">
                <div className="field">
                  <label>CIBIL Score</label>
                  <input
                    type="number"
                    name="cibil_score"
                    min="300"
                    max="900"
                    value={formData.cibil_score}
                    onChange={handleChange}
                    placeholder="e.g. 720"
                    required
                  />
                  <small className="field-hint">
                    Your credit score, usually between 300–900. Don't know
                    it? Check for free on your bank's app, or apps like
                    CRED, PhonePe, or Paytm.
                  </small>
                </div>

                <div className="field">
                  <label>Loans You've Ever Taken</label>
                  <input
                    type="number"
                    name="past_loans"
                    min="0"
                    value={formData.past_loans}
                    onChange={handleChange}
                    placeholder="e.g. 2"
                    required
                  />
                  <small className="field-hint">
                    Total loans in your life so far, including ones you've
                    fully paid off (car loan, personal loan, etc.).
                  </small>
                </div>

                <div className="field">
                  <label>Loans You're Still Paying</label>
                  <input
                    type="number"
                    name="existing_loans"
                    min="0"
                    value={formData.existing_loans}
                    onChange={handleChange}
                    placeholder="e.g. 1"
                    required
                  />
                  <small className="field-hint">
                    Loans you're currently repaying right now.
                  </small>
                </div>

                <div className="field">
                  <label>Payments Made On Time</label>
                  <input
                    type="number"
                    name="on_time_payments"
                    min="0"
                    value={formData.on_time_payments}
                    onChange={handleChange}
                    placeholder="e.g. 24"
                    required
                  />
                  <small className="field-hint">
                    Roughly how many loan/EMI payments you've paid on or
                    before the due date.
                  </small>
                </div>

                <div className="field">
                  <label>Payments Made Late</label>
                  <input
                    type="number"
                    name="late_payments"
                    min="0"
                    value={formData.late_payments}
                    onChange={handleChange}
                    placeholder="e.g. 0"
                    required
                  />
                  <small className="field-hint">
                    Roughly how many payments you made after the due date.
                  </small>
                </div>

                <div className="field">
                  <label>Loans You Couldn't Repay</label>
                  <input
                    type="number"
                    name="defaults"
                    min="0"
                    value={formData.defaults}
                    onChange={handleChange}
                    placeholder="e.g. 0"
                    required
                  />
                  <small className="field-hint">
                    Loans you were unable to pay back at all. Enter 0 if
                    none.
                  </small>
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3>Your Money & Existing Bills</h3>

              <div className="form-grid three">
                <div className="field">
                  <label>Monthly EMI You Pay Now (₹)</label>
                  <input
                    type="number"
                    name="existing_emi"
                    min="0"
                    value={formData.existing_emi}
                    onChange={handleChange}
                    placeholder="e.g. 5000"
                    required
                  />
                  <small className="field-hint">
                    Add up all your current monthly loan/EMI payments.
                    Enter 0 if you have none.
                  </small>
                </div>

                <div className="field">
                  <label>Credit Card Usage (%)</label>
                  <input
                    type="number"
                    name="credit_utilization"
                    min="0"
                    max="100"
                    step="1"
                    value={formData.credit_utilization}
                    onChange={handleChange}
                    placeholder="e.g. 30"
                    required
                  />
                  <small className="field-hint">
                    Of your total credit card limit, what % are you
                    currently using? E.g. if your limit is ₹1,00,000 and
                    you owe ₹30,000, enter 30. No credit card? Enter 0.
                  </small>
                </div>

                <div className="field">
                  <label>Money in Bank Account (₹)</label>
                  <input
                    type="number"
                    name="bank_balance"
                    min="0"
                    value={formData.bank_balance}
                    onChange={handleChange}
                    placeholder="e.g. 20000"
                    required
                  />
                  <small className="field-hint">
                    A rough estimate of what's in your bank account right
                    now is fine.
                  </small>
                </div>

                <div className="field">
                  <label>Savings / Fixed Deposits (₹)</label>
                  <input
                    type="number"
                    name="savings_balance"
                    min="0"
                    value={formData.savings_balance}
                    onChange={handleChange}
                    placeholder="e.g. 50000"
                    required
                  />
                  <small className="field-hint">
                    Total money set aside in savings accounts or fixed
                    deposits.
                  </small>
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3>The Loan You Want</h3>

              <div className="form-grid three">
                <div className="field">
                  <label>How Much Do You Want to Borrow? (₹)</label>
                  <input
                    type="number"
                    name="new_loan_amount"
                    min="0"
                    value={formData.new_loan_amount}
                    onChange={handleChange}
                    placeholder="e.g. 200000"
                    required
                  />
                </div>

                <div className="field">
                  <label>Repay Over How Many Months?</label>
                  <input
                    type="number"
                    name="loan_duration_months"
                    min="1"
                    value={formData.loan_duration_months}
                    onChange={handleChange}
                    placeholder="e.g. 24"
                    required
                  />
                  <small className="field-hint">
                    E.g. enter 24 for a 2-year loan.
                  </small>
                </div>

                <div className="field">
                  <label>What's It For?</label>
                  <select
                    name="loan_purpose"
                    value={formData.loan_purpose}
                    onChange={handleChange}
                  >
                    <option value="home">Home</option>
                    <option value="car">Car</option>
                    <option value="education">Education</option>
                    <option value="business">Business</option>
                    <option value="personal">Personal</option>
                    <option value="medical">Medical</option>
                  </select>
                </div>
              </div>
            </div>

            <button type="submit" className="assess-button" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Analyzing Your Profile...
                </>
              ) : (
                <>Check My Credit Risk →</>
              )}
            </button>
          </form>
        </section>

        {error && (
          <div className="error">
            <strong>Assessment Error</strong>
            <span>{error}</span>
          </div>
        )}

        {result && (
          <section id="customer-result" className="customer-result">
            <div className="customer-result-header">
              <span className="eyebrow">YOUR ASSESSMENT</span>
              <h2>Credit Risk Result</h2>
            </div>

            <div className="customer-score-card">
              <div>
                <span>Credit Risk Score</span>
                <div className="customer-score">
                  {result.credit_score}
                  <small>/100</small>
                </div>
              </div>

              <div>
                <h3>{result.decision}</h3>
                <p>{result.risk_label}</p>
              </div>
            </div>

            {result.ai_summary && (
              <div className="dashboard-card ai-summary-card">
                <span className="ai-tag">AI SUMMARY</span>
                <p>{result.ai_summary}</p>
              </div>
            )}

            <div className="customer-result-grid">
              <div className="dashboard-card">
                <h3>Risk Probability</h3>
                <p>
                  Good Credit: <strong>{result.good_credit_probability}%</strong>
                </p>
                <p>
                  Poor Credit: <strong>{result.poor_credit_probability}%</strong>
                </p>
              </div>

              <div className="dashboard-card">
                <h3>Why did I get this result?</h3>

                <div className="customer-explanations">
                  {result.explanation?.map((item, index) => {
                    const reducesRisk = item.direction === "reduces_risk";

                    const displayName =
                      featureNames[item.feature] ||
                      item.feature
                        .replaceAll("_", " ")
                        .replace(/\b\w/g, (char) => char.toUpperCase());

                    return (
                      <div
                        key={index}
                        className={`customer-explanation ${
                          reducesRisk ? "positive-factor" : "risk-factor"
                        }`}
                      >
                        <div>
                          <strong>{displayName}</strong>
                          <p>{item.reason}</p>
                        </div>

                        <span>{reducesRisk ? "Positive" : "Risk Factor"}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="dashboard-card advice-card">
              <h3>How can I improve my credit profile?</h3>

              {result.risk_label === "HIGHER RISK" ? (
                <div className="advice-list">
                  {result.improvement_advice?.map((advice, index) => (
                    <div key={index}>
                      <strong>{index + 1}. Improvement Recommendation</strong>
                      <p>{advice}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p>
                  Your current profile shows a lower level of credit risk.
                  Continue making payments on time and maintaining healthy
                  financial habits.
                </p>
              )}
            </div>

            <div className="customer-disclaimer">
              <strong>Important</strong>
              <p>
                This is an AI-based credit risk assessment and does not
                represent a final loan approval or rejection.
                {profile?.name ? ` Assessment for ${profile.name}.` : ""}
              </p>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default CustomerDashboard;
