import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../App.css";

function EmployeeLogin() {
  const navigate = useNavigate();

  const [employeeId, setEmployeeId] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await fetch(
        "http://127.0.0.1:5000/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: employeeId,
            employee_id: employeeId,
            password: password,
            role: "employee",
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Invalid employee ID or password"
        );
      }

      localStorage.setItem(
        "user",
        JSON.stringify(data.user)
      );

      navigate("/employee-dashboard");

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">

      <div className="auth-card">

        <div className="brand-icon">
          CG
        </div>

        <h1>
          CreditGuard <span>AI</span>
        </h1>

        <p className="auth-subtitle">
          Employee Login
        </p>

        <form onSubmit={handleLogin}>

          <label>
            Employee ID
          </label>

          <input
            type="text"
            placeholder="Enter unique bank employee ID"
            value={employeeId}
            onChange={(e) =>
              setEmployeeId(e.target.value)
            }
            required
          />

          <label>
            Passcode
          </label>

          <input
            type="password"
            placeholder="Enter passcode"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
            required
          />

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Logging in..."
              : "Login"}
          </button>

        </form>

        <p className="auth-switch">
          New employee?

          <button
            type="button"
            onClick={() =>
              navigate("/employee-signup")
            }
          >
            Create Account
          </button>
        </p>

        <button
          className="back-button"
          onClick={() => navigate("/")}
        >
          ← Back to Welcome
        </button>

      </div>

    </div>
  );
}

export default EmployeeLogin;