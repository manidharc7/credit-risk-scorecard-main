import { useState } from "react";

import { createOAuthProfile, logOut } from "../firebase/auth";

export function CompleteProfileForm({ role, firebaseUser, onDone }) {
  const [name, setName] = useState(firebaseUser.displayName || "");
  const [phone, setPhone] = useState(firebaseUser.phoneNumber || "");
  const [username, setUsername] = useState("");
  const [employeeId, setEmployeeId] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const phoneIsLocked = Boolean(firebaseUser.phoneNumber);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      const profile = await createOAuthProfile({
        uid: firebaseUser.uid,
        role,
        name,
        email: firebaseUser.email,
        phone,
        username,
        employeeId,
      });

      onDone(profile);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    await logOut();
  };

  return (
    <form onSubmit={handleSubmit}>
      <p className="field-hint" style={{ marginBottom: 4 }}>
        Almost done — just a few more details to finish creating your{" "}
        {role === "employee" ? "employee" : "customer"} account.
      </p>

      <label>Full Name</label>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Enter your full name"
        required
      />

      <label>Phone Number</label>
      <input
        type="tel"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="Enter phone number"
        readOnly={phoneIsLocked}
        required
      />

      <label>Username</label>
      <input
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Create username"
        required
      />

      {role === "employee" && (
        <>
          <label>Bank Employee ID</label>
          <input
            type="text"
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            placeholder="Example: BANK1001"
            required
          />
        </>
      )}

      {error && <div className="error-message">{error}</div>}

      <button type="submit" disabled={loading}>
        {loading ? "Finishing up..." : "Complete Account"}
      </button>

      <button
        type="button"
        className="ghost-button"
        onClick={handleCancel}
        style={{ marginTop: 8 }}
      >
        Cancel and sign out
      </button>
    </form>
  );
}
