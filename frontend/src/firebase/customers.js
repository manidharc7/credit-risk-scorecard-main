import { collection, getDocs, orderBy, query, where } from "firebase/firestore";

import { db } from "./config";

function mapAssessmentToFormValues(data) {
  return {
    age: data.age,
    sex: data.sex,
    employment_type: data.employmentType,
    employment_years: data.employmentYears,
    monthly_income: data.monthlyIncome,
    cibil_score: data.cibilScore,
    past_loans: data.pastLoans,
    on_time_payments: data.onTimePayments,
    late_payments: data.latePayments,
    defaults: data.defaults,
    existing_loans: data.existingLoans,
    existing_emi: data.existingEmi,
    credit_utilization: data.creditUtilization,
    dti_ratio: data.dtiRatio,
    bank_balance: data.bankBalance,
    savings_balance: data.savingsBalance,
    new_loan_amount: data.newLoanAmount,
    loan_duration_months: data.loanDurationMonths,
    loan_purpose: data.loanPurpose,
    identity_verified: data.identityVerified,
    address_verified: data.addressVerified,
    employment_verified: data.employmentVerified,
    background_verified: data.backgroundVerified,
    collateral_available: data.collateralAvailable,
  };
}

// Merges registered Customer Portal accounts with everyone who has ever
// been assessed by an employee, keyed by email, so the employee dashboard
// can offer a "pick an existing customer" autocomplete instead of forcing
// a full re-type for repeat customers. Where an assessment history exists,
// its most recent submission is attached as prefillable form values.
export async function fetchKnownCustomers() {
  const [usersSnap, assessmentsSnap] = await Promise.all([
    getDocs(query(collection(db, "users"), where("role", "==", "customer"))),
    getDocs(query(collection(db, "assessments"), orderBy("createdAt", "desc"))),
  ]);

  const byEmail = new Map();

  usersSnap.docs.forEach((docSnap) => {
    const data = docSnap.data();
    const email = (data.email || "").toLowerCase();

    if (!email) return;

    byEmail.set(email, {
      uid: docSnap.id,
      name: data.name,
      email: data.email,
      hasAccount: true,
      lastAssessedAt: null,
      formValues: null,
    });
  });

  assessmentsSnap.docs.forEach((docSnap) => {
    const data = docSnap.data();
    const email = (data.customerEmail || "").toLowerCase();

    if (!email) return;

    const existing = byEmail.get(email);

    // Assessments are ordered newest-first, so the first one seen per
    // email is already the most recent — later ones are stale, skip them.
    if (existing?.formValues) return;

    byEmail.set(email, {
      uid: existing?.uid || data.customerUid || null,
      name: data.customerName,
      email: data.customerEmail,
      hasAccount: existing?.hasAccount || false,
      lastAssessedAt: data.createdAt || null,
      formValues: mapAssessmentToFormValues(data),
    });
  });

  return Array.from(byEmail.values()).sort((a, b) =>
    (a.name || "").localeCompare(b.name || "")
  );
}
