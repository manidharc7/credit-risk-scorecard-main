import { useState } from "react";

import { updateOwnProfile } from "../firebase/auth";
import { useAuth } from "../context/useAuth";
import { useToast } from "../context/useToast";

export function AccountDetailsCard({ extraFields = [] }) {
  const { user, profile, refreshProfile } = useAuth();
  const toast = useToast();

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(profile?.name || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const startEdit = () => {
    setName(profile?.name || "");
    setPhone(profile?.phone || "");
    setError("");
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setError("");
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (!name.trim() || !phone.trim()) {
      setError("Name and phone can't be empty.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      await updateOwnProfile(user.uid, { name: name.trim(), phone: phone.trim() });
      await refreshProfile();
      toast.success("Profile updated.");
      setEditing(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="card">
      <div className="section-heading">
        <div>
          <span className="section-number">01</span>
          <div>
            <h2>Account Details</h2>
            <p>How your account is registered with CreditGuard AI.</p>
          </div>
        </div>

        {!editing && (
          <button type="button" className="ghost-button" onClick={startEdit}>
            Edit
          </button>
        )}
      </div>

      {editing ? (
        <form onSubmit={handleSave} className="profile-edit-form">
          <div className="profile-edit-fields">
            <div className="field">
              <label>Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="field">
              <label>Phone</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
          </div>

          <p className="field-hint">
            Email, username{extraFields.length > 0 ? ", and ID" : ""} can't be
            changed here.
          </p>

          {error && (
            <div className="error">
              <strong>Error</strong>
              <span>{error}</span>
            </div>
          )}

          <div className="profile-edit-actions">
            <button type="submit" className="assess-button" disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </button>
            <button
              type="button"
              className="ghost-button"
              onClick={cancelEdit}
              disabled={saving}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="profile-details-grid">
          <div>
            <small>Full Name</small>
            <strong>{profile?.name}</strong>
          </div>
          <div>
            <small>Email</small>
            <strong>{profile?.email || "—"}</strong>
          </div>
          <div>
            <small>Phone</small>
            <strong>{profile?.phone || "—"}</strong>
          </div>
          <div>
            <small>Username</small>
            <strong>{profile?.username}</strong>
          </div>
          {extraFields.map((f) => (
            <div key={f.label}>
              <small>{f.label}</small>
              <strong>{f.value || "—"}</strong>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
