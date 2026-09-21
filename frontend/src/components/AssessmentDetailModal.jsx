import { useEffect, useState } from "react";

function formatDate(timestamp) {
  if (!timestamp?.toDate) return "—";
  return timestamp.toDate().toLocaleString();
}

function formatCurrency(value) {
  if (value === undefined || value === null || value === "") return "—";
  return `₹${Number(value).toLocaleString()}`;
}

const FEATURE_LABELS = {
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

function displayFeatureName(feature) {
  return (
    FEATURE_LABELS[feature] ||
    feature.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

// Reconstructs a full report view (score, AI summary, SHAP factors,
// advice, loan & financial snapshot) from a stored Firestore
// `assessments` document — the same shape of data the dashboards show
// right after running a fresh assessment, just read back from history.
export function AssessmentDetailModal({ assessment, onClose }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  if (!assessment) return null;

  const a = assessment;

  const handleCopyId = async () => {
    try {
      await navigator.clipboard.writeText(a.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API unavailable — nothing to fall back to, ignore.
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <span className="eyebrow">
              {a.source === "self" ? "SELF-REPORTED" : "EMPLOYEE-VERIFIED"}
            </span>
            <h2>{a.customerName}</h2>
            <p>
              {a.customerEmail} · {formatDate(a.createdAt)}
            </p>
          </div>

          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="modal-body">
          <div className="modal-meta-grid">
            <div>
              <span>Source</span>
              <strong>{a.source === "self" ? "Self-Reported" : "Employee-Verified"}</strong>
            </div>
            <div>
              <span>Submitted</span>
              <strong>{formatDate(a.createdAt)}</strong>
            </div>
            <div>
              <span>Decision</span>
              <strong>{a.decision}</strong>
            </div>
            <div>
              <span>Record ID</span>
              <button type="button" className="mono-chip" onClick={handleCopyId}>
                {a.id}
                <span className="mono-chip-copy">{copied ? "✓" : "⧉"}</span>
              </button>
            </div>
          </div>

          <div className="customer-score-card">
            <div>
              <span>Credit Risk Score</span>
              <div className="customer-score">
                {a.riskScore}
                <small>/100</small>
              </div>
            </div>

            <div>
              <h3>{a.decision}</h3>
              <p>{a.riskLabel}</p>
            </div>
          </div>

          {a.aiSummary && (
            <div className="dashboard-card ai-summary-card">
              <span className="ai-tag">AI SUMMARY</span>
              <p>{a.aiSummary}</p>
            </div>
          )}

          <div className="customer-result-grid">
            <div className="dashboard-card">
              <h3>Risk Probability</h3>
              <p>
                Good Credit: <strong>{a.goodCreditProbability}%</strong>
              </p>
              <p>
                Poor Credit: <strong>{a.poorCreditProbability}%</strong>
              </p>
            </div>

            <div className="dashboard-card">
              <h3>Why this result?</h3>

              <div className="customer-explanations">
                {(a.shapExplanation || []).map((item, index) => {
                  const reducesRisk = item.direction === "reduces_risk";

                  return (
                    <div
                      key={index}
                      className={`customer-explanation ${
                        reducesRisk ? "positive-factor" : "risk-factor"
                      }`}
                    >
                      <div>
                        <strong>{displayFeatureName(item.feature)}</strong>
                        <p>{item.reason}</p>
                      </div>

                      <span>{reducesRisk ? "Positive" : "Risk Factor"}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {a.improvementAdvice?.length > 0 && (
            <div className="dashboard-card advice-card">
              <h3>Improvement Advice</h3>

              <div className="advice-list">
                {a.improvementAdvice.map((advice, index) => (
                  <div key={index}>
                    <strong>{index + 1}. Recommendation</strong>
                    <p>{advice}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="dashboard-card">
            <h3>Loan Request</h3>

            <div className="financial-bars">
              <div className="financial-row">
                <span>Requested Amount</span>
                <strong>{formatCurrency(a.newLoanAmount)}</strong>
              </div>
              <div className="financial-row">
                <span>Duration</span>
                <strong>{a.loanDurationMonths} months</strong>
              </div>
              <div className="financial-row">
                <span>Purpose</span>
                <strong style={{ textTransform: "capitalize" }}>
                  {a.loanPurpose}
                </strong>
              </div>
            </div>
          </div>

          <div className="customer-result-grid">
            <div className="dashboard-card">
              <h3>Financial Snapshot</h3>

              <div className="financial-bars">
                <div className="financial-row">
                  <span>Monthly Income</span>
                  <strong>{formatCurrency(a.monthlyIncome)}</strong>
                </div>
                <div className="financial-row">
                  <span>CIBIL Score</span>
                  <strong>{a.cibilScore}</strong>
                </div>
                <div className="financial-row">
                  <span>Existing EMI</span>
                  <strong>{formatCurrency(a.existingEmi)}</strong>
                </div>
                <div className="financial-row">
                  <span>Bank Balance</span>
                  <strong>{formatCurrency(a.bankBalance)}</strong>
                </div>
                <div className="financial-row">
                  <span>Savings Balance</span>
                  <strong>{formatCurrency(a.savingsBalance)}</strong>
                </div>
              </div>
            </div>

            <div className="dashboard-card">
              <h3>Verification Status</h3>

              <div className="verification-list">
                <div className="status-row">
                  <span>Identity</span>
                  <strong className={a.identityVerified ? "verified" : "not-verified"}>
                    {a.identityVerified ? "✓ Verified" : "✕ Not Verified"}
                  </strong>
                </div>
                <div className="status-row">
                  <span>Address</span>
                  <strong className={a.addressVerified ? "verified" : "not-verified"}>
                    {a.addressVerified ? "✓ Verified" : "✕ Not Verified"}
                  </strong>
                </div>
                <div className="status-row">
                  <span>Employment</span>
                  <strong className={a.employmentVerified ? "verified" : "not-verified"}>
                    {a.employmentVerified ? "✓ Verified" : "✕ Not Verified"}
                  </strong>
                </div>
                <div className="status-row">
                  <span>Background</span>
                  <strong className={a.backgroundVerified ? "verified" : "not-verified"}>
                    {a.backgroundVerified ? "✓ Verified" : "✕ Not Verified"}
                  </strong>
                </div>
                <div className="status-row">
                  <span>Collateral Available</span>
                  <strong className={a.collateralAvailable ? "verified" : "not-verified"}>
                    {a.collateralAvailable ? "✓ Yes" : "✕ No"}
                  </strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
