import { useEffect, useMemo, useState } from "react";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  updateDoc,
} from "firebase/firestore";

import { Sidebar } from "../components/Sidebar";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { SearchBar } from "../components/SearchBar";
import { AssessmentDetailModal } from "../components/AssessmentDetailModal";
import { db } from "../firebase/config";
import { useAuth } from "../context/useAuth";
import { useToast } from "../context/useToast";

function formatDate(timestamp) {
  if (!timestamp?.toDate) return "—";
  return timestamp.toDate().toLocaleString();
}

// Building the { title, message, confirmLabel, danger } for whichever
// step of the two-step confirm the pending user action is on. Removing
// a user or changing admin privileges is sensitive enough that a
// single "are you sure" is too easy to click through on autopilot —
// step 2 forces a distinct, deliberate second read before it fires.
function describeUserAction(action) {
  if (!action) return null;
  const { type, user, step } = action;

  if (type === "delete") {
    return step === 1
      ? {
          title: "Remove this user?",
          message: `This permanently deletes ${user.name}'s (${user.email}) account from CreditGuard AI. They'll be signed out and won't be able to log back in.`,
          confirmLabel: "Continue",
          danger: true,
        }
      : {
          title: "Are you absolutely sure?",
          message: `Final check — ${user.name}'s account will be deleted immediately. This can't be undone.`,
          confirmLabel: "Yes, Remove User",
          danger: true,
        };
  }

  const promoting = type === "promote";

  return step === 1
    ? {
        title: promoting ? "Make this employee an admin?" : "Remove admin privileges?",
        message: promoting
          ? `${user.name} will be able to manage other employees' admin status and remove user accounts.`
          : `${user.name} will lose access to the Admin Panel and user management.`,
        confirmLabel: "Continue",
        danger: !promoting,
      }
    : {
        title: "Are you sure?",
        message: promoting
          ? `Confirm: give ${user.name} admin privileges now.`
          : `Confirm: remove admin privileges from ${user.name} now.`,
        confirmLabel: promoting ? "Yes, Make Admin" : "Yes, Remove Admin",
        danger: !promoting,
      };
}

function AdminPanel() {
  const { isSuperAdmin } = useAuth();
  const toast = useToast();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userSearch, setUserSearch] = useState("");

  const [pendingAction, setPendingAction] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [assessments, setAssessments] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState("");
  const [historySearch, setHistorySearch] = useState("");
  const [selectedAssessment, setSelectedAssessment] = useState(null);
  const [deleteAssessmentTarget, setDeleteAssessmentTarget] = useState(null);
  const [deletingAssessment, setDeletingAssessment] = useState(false);

  useEffect(() => {
    const loadUsers = async () => {
      setLoading(true);
      setError("");

      try {
        const q = query(collection(db, "users"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        setUsers(snapshot.docs.map((docSnap) => docSnap.data()));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    const loadAssessments = async () => {
      setHistoryLoading(true);
      setHistoryError("");

      try {
        const q = query(collection(db, "assessments"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        setAssessments(
          snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
        );
      } catch (err) {
        setHistoryError(err.message);
      } finally {
        setHistoryLoading(false);
      }
    };

    loadUsers();
    loadAssessments();
  }, []);

  const filteredUsers = useMemo(() => {
    const term = userSearch.trim().toLowerCase();
    if (!term) return users;

    return users.filter((u) =>
      [u.name, u.email, u.username, u.employeeId, u.phone]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(term))
    );
  }, [users, userSearch]);

  const filteredAssessments = useMemo(() => {
    const term = historySearch.trim().toLowerCase();
    if (!term) return assessments;

    return assessments.filter((a) =>
      [a.customerName, a.customerEmail, a.decision, a.riskLabel]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(term))
    );
  }, [assessments, historySearch]);

  const handleUserActionConfirm = async () => {
    if (!pendingAction) return;

    if (pendingAction.step === 1) {
      setPendingAction({ ...pendingAction, step: 2 });
      return;
    }

    const { type, user } = pendingAction;
    setActionLoading(true);

    try {
      if (type === "delete") {
        await deleteDoc(doc(db, "users", user.uid));
        setUsers((current) => current.filter((u) => u.uid !== user.uid));
        toast.success(`${user.name}'s account has been removed.`);
      } else {
        const nextIsAdmin = type === "promote";
        await updateDoc(doc(db, "users", user.uid), { isAdmin: nextIsAdmin });
        setUsers((current) =>
          current.map((u) => (u.uid === user.uid ? { ...u, isAdmin: nextIsAdmin } : u))
        );
        toast.success(
          nextIsAdmin
            ? `${user.name} is now an admin.`
            : `${user.name} is no longer an admin.`
        );
      }
      setPendingAction(null);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteAssessment = async () => {
    if (!deleteAssessmentTarget) return;

    setDeletingAssessment(true);

    try {
      await deleteDoc(doc(db, "assessments", deleteAssessmentTarget.id));
      setAssessments((current) =>
        current.filter((a) => a.id !== deleteAssessmentTarget.id)
      );
      toast.success("Assessment record removed.");
      setDeleteAssessmentTarget(null);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeletingAssessment(false);
    }
  };

  const roleBadge = (u) => {
    if (u.isSuperAdmin) return <span className="badge super">Super Admin</span>;
    if (u.isAdmin) return <span className="badge admin">Admin</span>;
    return <span className="badge role">{u.role === "employee" ? "Employee" : "Customer"}</span>;
  };

  const userDialog = describeUserAction(pendingAction);

  return (
    <div className="app">
      <Sidebar portal="employee" />

      <main className="container">
        <section className="hero">
          <div className="hero-content">
            <span className="eyebrow">ACCESS CONTROL</span>

            <h1>
              Admin
              <span> Panel</span>
            </h1>

            <p>
              {isSuperAdmin
                ? "As the super admin, you can promote any employee to Admin, remove that privilege, or remove a user's account entirely."
                : "Registered users across both portals. Only the super admin can change admin privileges."}
            </p>
          </div>
        </section>

        <section className="card">
          <div className="history-toolbar">
            <div>
              <span className="ai-tag">USER DIRECTORY</span>
              <h3>All Registered Users</h3>
              <p>Customers and employees registered on CreditGuard AI.</p>
            </div>

            <span className="history-count">{users.length} Users</span>
          </div>

          <SearchBar
            value={userSearch}
            onChange={setUserSearch}
            placeholder="Search by name, email, username..."
          />

          {loading && <p>Loading users...</p>}

          {error && (
            <div className="error">
              <strong>Error</strong>
              <span>{error}</span>
            </div>
          )}

          {!loading && !error && users.length === 0 && (
            <div className="empty-state">No users registered yet.</div>
          )}

          {!loading && !error && users.length > 0 && filteredUsers.length === 0 && (
            <div className="empty-state">No users match "{userSearch}".</div>
          )}

          {!loading && !error && filteredUsers.length > 0 && (
            <div className="admin-table stagger">
              {filteredUsers.map((u) => (
                <div key={u.uid} className="admin-row">
                  <div>
                    <strong>{u.name}</strong>
                    <small>{u.email}</small>
                  </div>

                  <div>
                    <small>Username</small>
                    <strong>{u.username}</strong>
                  </div>

                  <div>
                    <small>{u.role === "employee" ? "Employee ID" : "Phone"}</small>
                    <strong>{u.role === "employee" ? u.employeeId : u.phone}</strong>
                  </div>

                  <div>{roleBadge(u)}</div>

                  <div className="admin-actions">
                    {isSuperAdmin && u.role === "employee" && !u.isSuperAdmin && (
                      <button
                        type="button"
                        className={u.isAdmin ? "demote-button" : "promote-button"}
                        onClick={() =>
                          setPendingAction({
                            type: u.isAdmin ? "demote" : "promote",
                            user: u,
                            step: 1,
                          })
                        }
                      >
                        {u.isAdmin ? "Remove Admin" : "Make Admin"}
                      </button>
                    )}

                    {isSuperAdmin && !u.isSuperAdmin && (
                      <button
                        type="button"
                        className="demote-button"
                        onClick={() =>
                          setPendingAction({ type: "delete", user: u, step: 1 })
                        }
                      >
                        Remove User
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="card" style={{ marginTop: 24 }}>
          <div className="history-toolbar">
            <div>
              <span className="ai-tag">ASSESSMENT HISTORY</span>
              <h3>All Credit Risk Assessments</h3>
              <p>Every assessment run across both portals. Admins can remove a record here.</p>
            </div>

            <span className="history-count">{assessments.length} Records</span>
          </div>

          <SearchBar
            value={historySearch}
            onChange={setHistorySearch}
            placeholder="Search by customer name or email..."
          />

          {historyLoading && <p>Loading assessment history...</p>}

          {historyError && (
            <div className="error">
              <strong>Error</strong>
              <span>{historyError}</span>
            </div>
          )}

          {!historyLoading && !historyError && assessments.length === 0 && (
            <div className="empty-state">No assessments recorded yet.</div>
          )}

          {!historyLoading &&
            !historyError &&
            assessments.length > 0 &&
            filteredAssessments.length === 0 && (
              <div className="empty-state">No records match "{historySearch}".</div>
            )}

          {!historyLoading && !historyError && filteredAssessments.length > 0 && (
            <div className="history-list stagger">
              {filteredAssessments.map((item) => (
                <div key={item.id} className="history-row history-row-admin">
                  <div
                    className="history-row-clickable"
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedAssessment(item)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setSelectedAssessment(item);
                      }
                    }}
                  >
                    <strong>{item.customerName}</strong>
                    <p>{item.customerEmail}</p>
                  </div>

                  <div>
                    <strong>{item.riskScore}/100</strong>
                    <small>Risk Score</small>
                  </div>

                  <div>
                    <span
                      className={`badge ${item.riskLabel === "LOWER RISK" ? "good" : "poor"}`}
                    >
                      {item.decision}
                    </span>
                  </div>

                  <div>
                    <small>{formatDate(item.createdAt)}</small>
                  </div>

                  <div className="admin-actions">
                    <button
                      type="button"
                      className="demote-button"
                      onClick={() => setDeleteAssessmentTarget(item)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {pendingAction && userDialog && (
        <ConfirmDialog
          title={userDialog.title}
          message={userDialog.message}
          confirmLabel={userDialog.confirmLabel}
          danger={userDialog.danger}
          loading={actionLoading}
          onConfirm={handleUserActionConfirm}
          onCancel={() => setPendingAction(null)}
        />
      )}

      {deleteAssessmentTarget && (
        <ConfirmDialog
          title="Remove this assessment record?"
          message={`This permanently deletes the assessment for ${deleteAssessmentTarget.customerName}. This can't be undone.`}
          confirmLabel="Remove Record"
          danger
          loading={deletingAssessment}
          onConfirm={handleDeleteAssessment}
          onCancel={() => setDeleteAssessmentTarget(null)}
        />
      )}

      {selectedAssessment && (
        <AssessmentDetailModal
          assessment={selectedAssessment}
          onClose={() => setSelectedAssessment(null)}
        />
      )}
    </div>
  );
}

export default AdminPanel;
