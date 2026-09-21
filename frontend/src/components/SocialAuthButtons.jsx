import { useRef, useState } from "react";

import {
  confirmPhoneCode,
  createRecaptchaVerifier,
  resolveProfileAfterOAuth,
  signInWithGoogle,
  startPhoneSignIn,
} from "../firebase/auth";

function GoogleLogo() {
  return (
    <svg viewBox="0 0 48 48" width="18" height="18" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M24 9.5c3.4 0 6.4 1.17 8.78 3.46l6.53-6.53C35.05 2.6 29.9 0.5 24 0.5 14.64 0.5 6.6 5.88 2.7 13.6l7.6 5.9C12.2 13.6 17.6 9.5 24 9.5Z"
      />
      <path
        fill="#4285F4"
        d="M46.5 24.5c0-1.64-.15-3.22-.42-4.74H24v9.02h12.65c-.55 2.9-2.2 5.36-4.68 7.01l7.2 5.6C43.3 37.5 46.5 31.5 46.5 24.5Z"
      />
      <path
        fill="#FBBC05"
        d="M10.3 28.5a13.8 13.8 0 0 1 0-9l-7.6-5.9a23.9 23.9 0 0 0 0 20.8l7.6-5.9Z"
      />
      <path
        fill="#34A853"
        d="M24 47.5c6.1 0 11.2-2 14.94-5.46l-7.2-5.6c-2 1.36-4.6 2.16-7.74 2.16-6.4 0-11.8-4.1-13.7-9.8l-7.6 5.9C6.6 42.12 14.64 47.5 24 47.5Z"
      />
    </svg>
  );
}

function PhoneLogo() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <rect x="7" y="2.5" width="10" height="19" rx="2" />
      <path strokeLinecap="round" d="M11 18h2" />
    </svg>
  );
}

// Handles Google popup sign-in and Phone (SMS OTP) sign-in. Both can
// create a brand-new Firebase Auth account on the spot, so on success
// the caller is told whether a Firestore profile already exists
// (`onSuccess`) or still needs to be completed (`onNeedsProfile`).
export function SocialAuthButtons({ role, onSuccess, onNeedsProfile }) {
  const recaptchaContainerRef = useRef(null);
  const recaptchaVerifierRef = useRef(null);

  const [phoneOpen, setPhoneOpen] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [code, setCode] = useState("");
  const [confirmationResult, setConfirmationResult] = useState(null);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const finishSignIn = async (firebaseUser) => {
    const result = await resolveProfileAfterOAuth(firebaseUser, role);

    if (result.needsProfile) {
      onNeedsProfile(firebaseUser);
    } else {
      onSuccess(result.profile);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    setError("");

    try {
      const firebaseUser = await signInWithGoogle();
      await finishSignIn(firebaseUser);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendCode = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      if (!recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current = createRecaptchaVerifier(
          recaptchaContainerRef.current
        );
      }

      const result = await startPhoneSignIn(
        phoneNumber,
        recaptchaVerifierRef.current
      );

      setConfirmationResult(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmCode = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      const firebaseUser = await confirmPhoneCode(confirmationResult, code);
      await finishSignIn(firebaseUser);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginTop: 20 }}>
      <div className="auth-divider">or continue with</div>

      <button
        type="button"
        className="ghost-button social-button"
        onClick={handleGoogle}
        disabled={loading}
      >
        <GoogleLogo />
        Continue with Google
      </button>

      <button
        type="button"
        className="ghost-button social-button"
        style={{ marginTop: 8 }}
        onClick={() => setPhoneOpen((open) => !open)}
        disabled={loading}
      >
        <PhoneLogo />
        {phoneOpen ? "Hide phone sign-in" : "Continue with Phone"}
      </button>

      {phoneOpen && !confirmationResult && (
        <form onSubmit={handleSendCode} style={{ marginTop: 12 }}>
          <label>Phone Number</label>
          <input
            type="tel"
            placeholder="+91XXXXXXXXXX"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            required
          />
          <small className="field-hint">
            Include the country code, e.g. +91 for India.
          </small>

          <button type="submit" disabled={loading} style={{ marginTop: 12 }}>
            {loading ? "Sending code..." : "Send Verification Code"}
          </button>
        </form>
      )}

      {phoneOpen && confirmationResult && (
        <form onSubmit={handleConfirmCode} style={{ marginTop: 12 }}>
          <label>Verification Code</label>
          <input
            type="text"
            inputMode="numeric"
            placeholder="6-digit code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
          />

          <button type="submit" disabled={loading} style={{ marginTop: 12 }}>
            {loading ? "Verifying..." : "Verify & Continue"}
          </button>
        </form>
      )}

      {error && (
        <div className="error-message" style={{ marginTop: 12 }}>
          {error}
        </div>
      )}

      <div ref={recaptchaContainerRef}></div>
    </div>
  );
}
