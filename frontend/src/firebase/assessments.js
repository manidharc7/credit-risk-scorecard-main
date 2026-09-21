import { addDoc, collection, serverTimestamp } from "firebase/firestore";

import { db } from "./config";

// The Cloud Run API uses snake_case field names; Firestore documents in
// this app use camelCase (matching the rest of the users/customers
// collections), so every assessment write goes through this mapping.
function mapFormToAssessmentFields(payload) {
  return {
    age: payload.age,
    sex: payload.sex,
    employmentType: payload.employment_type,
    employmentYears: payload.employment_years,
    monthlyIncome: payload.monthly_income,
    cibilScore: payload.cibil_score,
    pastLoans: payload.past_loans,
    onTimePayments: payload.on_time_payments,
    latePayments: payload.late_payments,
    defaults: payload.defaults,
    existingLoans: payload.existing_loans,
    existingEmi: payload.existing_emi,
    creditUtilization: payload.credit_utilization,
    dtiRatio: payload.dti_ratio,
    bankBalance: payload.bank_balance,
    savingsBalance: payload.savings_balance,
    newLoanAmount: payload.new_loan_amount,
    loanDurationMonths: payload.loan_duration_months,
    loanPurpose: payload.loan_purpose,
    identityVerified: payload.identity_verified,
    addressVerified: payload.address_verified,
    employmentVerified: payload.employment_verified,
    backgroundVerified: payload.background_verified,
    collateralAvailable: payload.collateral_available,
  };
}

// Saves a completed assessment report so it's visible later from both
// the customer's own profile and the employee/admin shared history.
//
// `source` is "employee" (run by bank staff, optionally linked back to a
// registered customer account via customerUid) or "self" (the customer
// ran their own assessment — always linked via customerUid).
export async function saveAssessment({
  payload,
  apiResult,
  customerName,
  customerEmail,
  customerUid,
  customerDocId,
  performedBy,
  source,
}) {
  await addDoc(collection(db, "assessments"), {
    customerId: customerDocId || null,
    customerUid: customerUid || null,
    customerName,
    customerEmail,

    ...mapFormToAssessmentFields(payload),

    decision: apiResult.decision,
    riskLabel: apiResult.risk_label,
    riskScore: apiResult.credit_score,

    goodCreditProbability: apiResult.good_credit_probability,
    poorCreditProbability: apiResult.poor_credit_probability,

    shapExplanation: apiResult.explanation,
    improvementAdvice: apiResult.improvement_advice || [],
    aiSummary: apiResult.ai_summary || null,

    performedBy: performedBy || null,
    source,

    createdAt: serverTimestamp(),
  });
}
