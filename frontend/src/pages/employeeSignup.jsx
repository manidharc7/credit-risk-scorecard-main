import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { signUp } from "../firebase/auth";
import { useToast } from "../context/useToast";

function EmployeeSignup() {
  const navigate = useNavigate();
  const toast = useToast();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    username: "",
    password: "",
    employeeId: "",
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSignup = async (e) => {
    e.preventDefault();

    setLoading(true);
    setMessage("");
    setError("");

    try {
      await signUp({ ...formData, role: "employee" });

      setMessage("Employee account created successfully!");
      toast.success("Account created — please log in.");

      setTimeout(() => {
        navigate("/employee-login");
      }, 1200);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="brand-icon">CG</div>

        <h1>
          CreditGuard <span>AI</span>
        </h1>

        <p className="auth-subtitle">Employee Registration</p>

        <form onSubmit={handleSignup}>
          <label>Full Name</label>
          <input
            type="text"
            name="name"
            placeholder="Enter your name"
            value={formData.name}
            onChange={handleChange}
            required
          />

          <label>Work Email</label>
          <input
            type="email"
            name="email"
            placeholder="employee@bank.com"
            value={formData.email}
            onChange={handleChange}
            required
          />

          <label>Phone Number</label>
          <input
            type="tel"
            name="phone"
            placeholder="Enter phone number"
            value={formData.phone}
            onChange={handleChange}
            required
          />

          <label>Bank Employee ID</label>
          <input
            type="text"
            name="employeeId"
            placeholder="Example: BANK1001"
            value={formData.employeeId}
            onChange={handleChange}
            required
          />

          <label>Username</label>
          <input
            type="text"
            name="username"
            placeholder="Create username"
            value={formData.username}
            onChange={handleChange}
            required
          />

          <label>Password</label>
          <input
            type="password"
            name="password"
            placeholder="Create password (min 6 characters)"
            value={formData.password}
            onChange={handleChange}
            minLength={6}
            required
          />

          {message && <div className="success-message">{message}</div>}
          {error && <div className="error-message">{error}</div>}

          <button type="submit" disabled={loading}>
            {loading ? "Creating Account..." : "Create Employee Account"}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account?
          <button type="button" onClick={() => navigate("/employee-login")}>
            Login
          </button>
        </p>

        <button className="back-button" onClick={() => navigate("/")}>
          ← Back to Welcome
        </button>
      </div>
    </div>
  );
}

export default EmployeeSignup;
