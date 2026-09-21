import { useNavigate } from "react-router-dom";

function Welcome() {
  const navigate = useNavigate();

  return (
    <div className="welcome-page">

      <div className="welcome-card">

        <div className="brand-icon">
          CG
        </div>

        <h1>
          CreditGuard <span>AI</span>
        </h1>

        <p>
          Intelligent Credit Risk Platform
        </p>

        <h2>
          Welcome
        </h2>

        <p className="choose-text">
          Select how you want to continue
        </p>

        <div className="portal-buttons">

          <button
            onClick={() => navigate("/employee-login")}
          >
            <strong>Employee Portal</strong>
            <span>Bank employee access →</span>
          </button>

          <button
            onClick={() => navigate("/customer-login")}
          >
            <strong>Customer Portal</strong>
            <span>Check your credit risk →</span>
          </button>

        </div>

      </div>

    </div>
  );
}

export default Welcome;