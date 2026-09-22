import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { logIn, resetPassword } from "../firebase/auth";
import { useToast } from "../context/useToast";
import { SocialAuthButtons } from "../components/SocialAuthButtons";
import { CompleteProfileForm } from "../components/CompleteProfileForm";
import logo from "../assets/logo.png";

function EmployeeLogin() {
  const navigate = useNavigate();
  const toast = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingUser, setPendingUser] = useState(null);
  const [resetLoading, setResetLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      await logIn({ email, password, expectedRole: "employee" });

      toast.success("Welcome back!");
      navigate("/employee-dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSocialSuccess = () => {
    toast.success("Welcome back!");
    navigate("/employee-dashboard");
  };

  const handleProfileComplete = () => {
    toast.success("Account created — welcome!");
    navigate("/employee-dashboard");
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError("Enter your email above first, then click Forgot password?");
      return;
    }

    setResetLoading(true);
    setError("");

    try {
      await resetPassword(email);
      toast.success(`Password reset email sent to ${email}.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setResetLoading(false);
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

        <p className="auth-subtitle">Employee Login</p>

        {pendingUser ? (
          <CompleteProfileForm
            role="employee"
            firebaseUser={pendingUser}
            onDone={handleProfileComplete}
          />
        ) : (
          <>
            <form onSubmit={handleLogin}>
              <label>Work Email</label>

              <input
                type="email"
                placeholder="employee@bank.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <div className="field-label-row">
                <label>Passcode</label>
                <button
                  type="button"
                  className="inline-link-button"
                  onClick={handleForgotPassword}
                  disabled={resetLoading}
                >
                  {resetLoading ? "Sending..." : "Forgot password?"}
                </button>
              </div>

              <input
                type="password"
                placeholder="Enter passcode"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              {error && <div className="error-message">{error}</div>}

              <button type="submit" disabled={loading}>
                {loading ? "Logging in..." : "Login"}
              </button>
            </form>

            <SocialAuthButtons
              role="employee"
              onSuccess={handleSocialSuccess}
              onNeedsProfile={setPendingUser}
            />

            <p className="auth-switch">
              New employee?
              <button
                type="button"
                onClick={() => navigate("/employee-signup")}
              >
                Create Account
              </button>
            </p>

            <button className="back-button" onClick={() => navigate("/")}>
              ← Back to Welcome
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default EmployeeLogin;
