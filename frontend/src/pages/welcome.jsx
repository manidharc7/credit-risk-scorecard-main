import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../context/useAuth";
import { ThemeToggle } from "../components/ThemeToggle";
import logo from "../assets/logo.png";

const FEATURES = [
  {
    title: "Explainable, not a black box",
    description:
      "Every score comes with the specific factors behind it, ranked by impact, in plain language — powered by SHAP.",
  },
  {
    title: "A decision in seconds",
    description:
      "Enter your details once and get a full risk breakdown immediately, with no queue and no waiting on a branch visit.",
  },
  {
    title: "Accounts kept separate, on purpose",
    description:
      "Customer and employee access are enforced at the data layer, and only one account can ever grant admin rights.",
  },
  {
    title: "Checked for fairness",
    description:
      "The underlying model is evaluated across customer groups during development, not just for accuracy.",
  },
];

const STEPS = [
  {
    title: "Register",
    description: "Create a customer account — a name, email, and a minute of your time.",
  },
  {
    title: "Answer honestly",
    description:
      "Income, job, existing loans, payment history. Rough numbers are fine.",
  },
  {
    title: "Read the report",
    description:
      "Your score, what's driving it, and specific steps to improve it.",
  },
];

function Welcome() {
  const navigate = useNavigate();
  const { isAuthenticated, profile } = useAuth();

  const dashboardPath =
    profile?.role === "employee" ? "/employee-dashboard" : "/customer-dashboard";

  const [navHidden, setNavHidden] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;

      if (currentY <= 0) {
        setNavHidden(false);
      } else if (currentY > lastScrollY.current) {
        setNavHidden(true); // scrolling down — get out of the way
      } else {
        setNavHidden(false); // scrolling up — bring it back
      }

      lastScrollY.current = currentY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="landing-page">
      <header className={`landing-nav ${navHidden ? "landing-nav-hidden" : ""}`}>
        <div className="brand">
          <img className="brand-icon" src={logo} alt="CreditGuard AI" />
          <div className="logo">
            CreditGuard <span>AI</span>
          </div>
        </div>

        <nav className="landing-nav-links">
          <a href="#features">Approach</a>
          <a href="#how-it-works">How It Works</a>
        </nav>

        <div className="landing-nav-actions">
          {isAuthenticated ? (
            <button
              type="button"
              className="assess-button"
              onClick={() => navigate(dashboardPath)}
            >
              Go to Dashboard →
            </button>
          ) : (
            <>
              <button
                type="button"
                className="ghost-button"
                onClick={() => navigate("/employee-login")}
              >
                Employee Login
              </button>
              <button
                type="button"
                className="assess-button"
                onClick={() => navigate("/customer-login")}
              >
                Customer Portal
              </button>
            </>
          )}
        </div>

        <ThemeToggle />
      </header>

      <section className="landing-hero">
        <div className="landing-hero-inner">
          <div>
            <span className="eyebrow">CREDIT RISK, EXPLAINED</span>

            <h1>
              {isAuthenticated ? (
                <>
                  Welcome back,
                  <br />
                  <em>{profile?.name?.split(" ")[0] || "there"}.</em>
                </>
              ) : (
                <>
                  Know where you stand.
                  <br />
                  <em>Know why.</em>
                </>
              )}
            </h1>

            <p>
              CreditGuard AI reads your financial profile and returns a
              risk score with the actual reasoning behind it — the same
              tool bank staff use, in your hands.
            </p>

            <div className="landing-hero-actions">
              {isAuthenticated ? (
                <button
                  type="button"
                  className="assess-button"
                  onClick={() => navigate(dashboardPath)}
                >
                  Go to My Dashboard →
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    className="assess-button"
                    onClick={() => navigate("/customer-login")}
                  >
                    Check My Credit Risk →
                  </button>

                  <button
                    type="button"
                    className="hero-outline-button"
                    onClick={() => navigate("/employee-login")}
                  >
                    Employee Portal
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="hero-mockup">
            <div className="hero-mockup-header">
              <span>Sample Report</span>
              <span>Lower Risk</span>
            </div>

            <div className="hero-mockup-score">
              <strong>82</strong>
              <span>/ 100 risk score</span>
            </div>

            <div className="hero-mockup-bar-row">
              <span className="hero-mockup-bar-label">CIBIL Score</span>
              <div className="hero-mockup-track">
                <div className="hero-mockup-fill" style={{ width: "78%" }} />
              </div>
            </div>

            <div className="hero-mockup-bar-row">
              <span className="hero-mockup-bar-label">On-Time Payments</span>
              <div className="hero-mockup-track">
                <div
                  className="hero-mockup-fill alt"
                  style={{ width: "92%" }}
                />
              </div>
            </div>

            <div className="hero-mockup-bar-row">
              <span className="hero-mockup-bar-label">Credit Usage</span>
              <div className="hero-mockup-track">
                <div className="hero-mockup-fill" style={{ width: "34%" }} />
              </div>
            </div>

            <div className="hero-mockup-footer">
              <span>
                Top factor: <strong>CIBIL Score</strong> — reduces risk
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="stat-strip">
        <div className="stat-strip-inner">
          <div className="stat-item">
            <strong>300–900</strong>
            <span>CIBIL score range analyzed</span>
          </div>
          <div className="stat-item">
            <strong>8</strong>
            <span>Ranked factors per report</span>
          </div>
          <div className="stat-item">
            <strong>&lt;5 min</strong>
            <span>To complete an assessment</span>
          </div>
        </div>
      </section>

      <section id="features" className="landing-section">
        <div className="landing-section-heading">
          <span className="eyebrow">APPROACH</span>
          <h2>Built to be read, not just trusted</h2>
          <p>
            A credit decision that affects you deserves a reason you can
            actually follow.
          </p>
        </div>

        <div className="feature-list">
          {FEATURES.map((feature, index) => (
            <div className="feature-row" key={feature.title}>
              <span className="feature-index">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="landing-section">
        <div className="landing-section-heading">
          <span className="eyebrow">HOW IT WORKS</span>
          <h2>Three steps, no paperwork</h2>
        </div>

        <div className="steps-row">
          {STEPS.map((step, index) => (
            <div className="step-card" key={step.title}>
              <span className="step-number">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="landing-cta">
        {isAuthenticated ? (
          <>
            <h2>Pick up where you left off</h2>
            <p>You're signed in as {profile?.name || "your account"}.</p>

            <div className="landing-cta-actions">
              <Link to={dashboardPath} className="landing-cta-primary">
                Go to Dashboard
              </Link>
            </div>
          </>
        ) : (
          <>
            <h2>Ready to see your report?</h2>
            <p>It takes less than five minutes, and it's free to check.</p>

            <div className="landing-cta-actions">
              <Link to="/customer-signup" className="landing-cta-primary">
                Create Customer Account
              </Link>
              <Link to="/employee-login" className="landing-cta-secondary">
                Employee Login
              </Link>
            </div>
          </>
        )}
      </section>

      <footer className="landing-footer">
        <div className="landing-footer-inner">
          <div className="brand">
            <img className="brand-icon" src={logo} alt="CreditGuard AI" />
            <div className="logo">
              CreditGuard <span>AI</span>
            </div>
          </div>

          <nav className="landing-footer-links">
            <Link to="/customer-login">Customer Portal</Link>
            <Link to="/employee-login">Employee Portal</Link>
          </nav>

          <span className="landing-footer-copy">
            © {new Date().getFullYear()} CreditGuard AI. Decision support,
            not a final lending decision.
          </span>
        </div>
      </footer>
    </div>
  );
}

export default Welcome;
