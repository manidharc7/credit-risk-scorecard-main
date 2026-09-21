import { useEffect, useState } from "react";
import { collection, getDocs, orderBy, query, where } from "firebase/firestore";

import { Sidebar } from "../components/Sidebar";
import { AssessmentDetailModal } from "../components/AssessmentDetailModal";
import { db } from "../firebase/config";
import { useAuth } from "../context/useAuth";

function formatDate(timestamp) {
  if (!timestamp?.toDate) return "—";
  return timestamp.toDate().toLocaleString();
}

function CustomerProfile() {
  const { user, profile } = useAuth();

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const q = query(
          collection(db, "assessments"),
          where("customerUid", "==", user.uid),
          orderBy("createdAt", "desc")
        );

        const snapshot = await getDocs(q);

        setReports(
          snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
        );
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user.uid]);

  return (
    <div className="customer-page">
      <Sidebar portal="customer" />

      <main className="customer-container">
        <section className="customer-hero">
          <span className="eyebrow">YOUR ACCOUNT</span>

          <h1>
            My
            <span> Profile</span>
          </h1>

          <p>Your account details and every credit risk report on file.</p>
        </section>

        <section className="card">
          <div className="section-heading">
            <div>
              <span className="section-number">01</span>
              <div>
                <h2>Account Details</h2>
                <p>How your account is registered with CreditGuard AI.</p>
              </div>
            </div>
          </div>

          <div className="profile-details-grid">
            <div>
              <small>Full Name</small>
              <strong>{profile?.name}</strong>
            </div>
            <div>
              <small>Email</small>
              <strong>{profile?.email || "—"}</strong>
            </div>
            <div>
              <small>Phone</small>
              <strong>{profile?.phone || "—"}</strong>
            </div>
            <div>
              <small>Username</small>
              <strong>{profile?.username}</strong>
            </div>
          </div>
        </section>

        <section className="card" style={{ marginTop: 24 }}>
          <div className="history-toolbar">
            <div>
              <span className="ai-tag">REPORT HISTORY</span>
              <h3>My Credit Risk Reports</h3>
              <p>
                Every report generated for you — whether you ran it yourself
                or a bank employee ran it on your behalf.
              </p>
            </div>

            <span className="history-count">{reports.length} Reports</span>
          </div>

          {loading && <p>Loading your reports...</p>}

          {error && (
            <div className="error">
              <strong>Error</strong>
              <span>{error}</span>
            </div>
          )}

          {!loading && !error && reports.length === 0 && (
            <div className="empty-state">
              No reports yet. Run a credit risk assessment from your
              dashboard to see it appear here.
            </div>
          )}

          {!loading && !error && reports.length > 0 && (
            <div className="history-list stagger">
              {reports.map((item) => (
                <div
                  key={item.id}
                  className="history-row history-row-clickable"
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelected(item)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelected(item);
                    }
                  }}
                >
                  <div>
                    <strong>{item.decision}</strong>
                    <p>
                      {item.source === "self"
                        ? "Self-assessment"
                        : "Assessed by bank employee"}
                    </p>
                  </div>

                  <div>
                    <strong>{item.riskScore}/100</strong>
                    <small>Risk Score</small>
                  </div>

                  <div>
                    <span
                      className={`badge ${
                        item.riskLabel === "LOWER RISK" ? "good" : "poor"
                      }`}
                    >
                      {item.riskLabel}
                    </span>
                  </div>

                  <div>
                    <span>Good: {item.goodCreditProbability}%</span>
                    <br />
                    <span>Poor: {item.poorCreditProbability}%</span>
                  </div>

                  <div>
                    <small>{formatDate(item.createdAt)}</small>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {selected && (
        <AssessmentDetailModal
          assessment={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}

export default CustomerProfile;
