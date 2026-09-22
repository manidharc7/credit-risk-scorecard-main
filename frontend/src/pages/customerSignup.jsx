import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { signUp } from "../firebase/auth";
import { useToast } from "../context/useToast";
import logo from "../assets/logo.png";

function CustomerSignup() {
  const navigate = useNavigate();
  const toast = useToast();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    username: "",
    password: "",
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
      await signUp({ ...formData, role: "customer" });

      setMessage("Account created successfully!");
      toast.success("Account created — please log in.");

      setTimeout(() => {
        navigate("/customer-login");
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
        <div className="brand-icon">
          <img src={logo} alt="CreditGuard AI" />
        </div>

        <h1>
          CreditGuard <span>AI</span>
        </h1>

        <p className="auth-subtitle">Customer Registration</p>

        <form onSubmit={handleSignup}>
          <label>Full Name</label>
          <input
            type="text"
            name="name"
            placeholder="Enter your full name"
            value={formData.name}
            onChange={handleChange}
            required
          />

          <label>Email</label>
          <input
            type="email"
            name="email"
            placeholder="yourname@gmail.com"
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
            {loading ? "Creating Account..." : "Create Customer Account"}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account?
          <button type="button" onClick={() => navigate("/customer-login")}>
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

export default CustomerSignup;
