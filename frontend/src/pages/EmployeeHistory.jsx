import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../App.css";

function EmployeeHistory() {
  const navigate = useNavigate();

  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("http://127.0.0.1:5000/employee/assessments")
      .then(async (response) => {
        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error || "Failed to load assessments"
          );
        }

        return data;
      })
      .then((data) => {
        setAssessments(data.assessments || []);
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <div className="app">

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
              Employee Assessment History
            </div>
          </div>

        </div>

        <div className="system-status">
          <span className="status-dot"></span>
          AI Model Online
        </div>

      </header>


      <main className="container">

        <section className="hero">

          <div className="hero-content">

            <span className="eyebrow">
              EMPLOYEE PORTAL
            </span>

            <h1>
              Customer Assessment
              <span> History</span>
            </h1>

            <p>
              View previously completed customer
              credit-risk assessments.
            </p>

          </div>

        </section>


        <section className="card">

          <div className="dashboard-card-header">

            <div>

              <span className="ai-tag">
                STORED RECORDS
              </span>

              <h3>
                Customer Assessments
              </h3>

              <p>
                Assessments submitted through the
                employee portal.
              </p>

            </div>

            <strong>
              {assessments.length} Records
            </strong>

          </div>


          {loading && (
            <p>
              Loading customer assessments...
            </p>
          )}


          {error && (
            <div className="error">
              <strong>
                Error
              </strong>

              <span>
                {error}
              </span>
            </div>
          )}


          {!loading &&
            !error &&
            assessments.length === 0 && (

              <p>
                No customer assessments found.
              </p>

            )}


          {!loading &&
            !error &&
            assessments.length > 0 && (

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                  marginTop: "24px",
                }}
              >

                {assessments.map((customer) => (

                  <div
                    key={customer.id}
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "2fr 1fr 1.5fr 1.5fr 1.5fr",
                      gap: "20px",
                      alignItems: "center",
                      padding: "20px",
                      border: "1px solid #e5e7eb",
                      borderRadius: "14px",
                    }}
                  >

                    <div>
                      <strong>
                        {customer.customer_name}
                      </strong>

                      <p>
                        {customer.customer_email}
                      </p>
                    </div>


                    <div>
                      <strong>
                        {customer.risk_score}/100
                      </strong>

                      <small>
                        Risk Score
                      </small>
                    </div>


                    <div>
                      <strong>
                        {customer.decision}
                      </strong>

                      <small>
                        {customer.risk_label}
                      </small>
                    </div>


                    <div>

                      <span>
                        Good:{" "}
                        {customer.good_credit_probability}%
                      </span>

                      <br />

                      <span>
                        Poor:{" "}
                        {customer.poor_credit_probability}%
                      </span>

                    </div>


                    <div>

                      <small>
                        {customer.created_at}
                      </small>

                    </div>

                  </div>

                ))}

              </div>

            )}


          <button
            type="button"
            className="assess-button"
            onClick={() =>
              navigate("/employee-dashboard")
            }
            style={{
              marginTop: "30px",
            }}
          >
            ← Back to Employee Dashboard
          </button>

        </section>

      </main>

    </div>
  );
}

export default EmployeeHistory;