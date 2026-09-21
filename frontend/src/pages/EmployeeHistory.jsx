import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { collection, getDocs, orderBy, query } from "firebase/firestore";

import { Sidebar } from "../components/Sidebar";
import { AssessmentDetailModal } from "../components/AssessmentDetailModal";
import { db } from "../firebase/config";

function formatDate(timestamp) {
  if (!timestamp?.toDate) return "—";
  return timestamp.toDate().toLocaleString();
}

function EmployeeHistory() {
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const q = query(
          collection(db, "assessments"),
          orderBy("createdAt", "desc")
        );

        const snapshot = await getDocs(q);

        setAssessments(
          snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
        );
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return (
    <div className="app">
      <Sidebar portal="employee" />

      <main className="container">
        <section className="hero">
          <div className="hero-content">
            <span className="eyebrow">EMPLOYEE PORTAL</span>

            <h1>
              Customer Assessment
              <span> History</span>
            </h1>

            <p>View previously completed customer credit-risk assessments.</p>
          </div>
        </section>

        <section className="card">
          <div className="history-toolbar">
            <div>
              <span className="ai-tag">STORED RECORDS</span>
              <h3>Customer Assessments</h3>
              <p>Assessments submitted through the employee portal.</p>
            </div>

            <span className="history-count">{assessments.length} Records</span>
          </div>

          {loading && <p>Loading customer assessments...</p>}

          {error && (
            <div className="error">
              <strong>Error</strong>
              <span>{error}</span>
            </div>
          )}

          {!loading && !error && assessments.length === 0 && (
            <div className="empty-state">No customer assessments found yet.</div>
          )}

          {!loading && !error && assessments.length > 0 && (
            <div className="history-list stagger">
              {assessments.map((item) => (
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
                    <strong>{item.customerName}</strong>
                    <p>{item.customerEmail}</p>
                    <span className="badge role" style={{ marginTop: 6 }}>
                      {item.source === "self"
                        ? "Self-reported"
                        : "Employee-verified"}
                    </span>
                  </div>

                  <div>
                    <strong>{item.riskScore}/100</strong>
                    <small>Risk Score</small>
                  </div>

                  <div>
                    <span className={`badge ${item.riskLabel === "LOWER RISK" ? "good" : "poor"}`}>
                      {item.decision}
                    </span>
                    <br />
                    <small>{item.riskLabel}</small>
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

          <Link
            to="/employee-dashboard"
            className="ghost-button"
            style={{ display: "inline-block", marginTop: 30, textDecoration: "none" }}
          >
            ← Back to Employee Dashboard
          </Link>
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

export default EmployeeHistory;
