import { useEffect, useState } from "react";
import { collection, doc, getDocs, orderBy, query, updateDoc } from "firebase/firestore";

import { Sidebar } from "../components/Sidebar";
import { db } from "../firebase/config";
import { useAuth } from "../context/useAuth";
import { useToast } from "../context/useToast";

function AdminPanel() {
  const { isSuperAdmin } = useAuth();
  const toast = useToast();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pendingUid, setPendingUid] = useState(null);

  const refreshUsers = async () => {
    const q = query(collection(db, "users"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    setUsers(snapshot.docs.map((docSnap) => docSnap.data()));
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");

      try {
        await refreshUsers();
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const toggleAdmin = async (targetUser) => {
    setPendingUid(targetUser.uid);

    try {
      await updateDoc(doc(db, "users", targetUser.uid), {
        isAdmin: !targetUser.isAdmin,
      });

      setUsers((current) =>
        current.map((u) =>
          u.uid === targetUser.uid ? { ...u, isAdmin: !u.isAdmin } : u
        )
      );

      toast.success(
        targetUser.isAdmin
          ? `${targetUser.name} is no longer an admin.`
          : `${targetUser.name} is now an admin.`
      );
    } catch (err) {
      toast.error(err.message);
    } finally {
      setPendingUid(null);
    }
  };

  const roleBadge = (u) => {
    if (u.isSuperAdmin) return <span className="badge super">Super Admin</span>;
    if (u.isAdmin) return <span className="badge admin">Admin</span>;
    return <span className="badge role">{u.role === "employee" ? "Employee" : "Customer"}</span>;
  };

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
                ? "As the super admin, you can promote any employee to Admin, or remove that privilege at any time."
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

          {!loading && !error && users.length > 0 && (
            <div className="admin-table stagger">
              {users.map((u) => (
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
                        disabled={pendingUid === u.uid}
                        onClick={() => toggleAdmin(u)}
                      >
                        {pendingUid === u.uid
                          ? "Updating..."
                          : u.isAdmin
                          ? "Remove Admin"
                          : "Make Admin"}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default AdminPanel;
