import { Link, NavLink, useNavigate } from "react-router-dom";

import { useAuth } from "../context/useAuth";
import { logOut } from "../firebase/auth";

function GaugeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" d="M4 15a8 8 0 1 1 16 0" />
      <path strokeLinecap="round" d="M12 15l4-5" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="8.5" />
      <path strokeLinecap="round" d="M12 7.5V12l3 2" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3 4.5 6v6c0 4.7 3.2 8.4 7.5 9 4.3-.6 7.5-4.3 7.5-9V6L12 3Z" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="8.5" r="3.3" />
      <path strokeLinecap="round" d="M5 20c1.2-3.6 4-5.4 7-5.4s5.8 1.8 7 5.4" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 17.5V19a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v1.5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h11m0 0-3-3m3 3-3 3" />
    </svg>
  );
}

export function Sidebar({ portal }) {
  const navigate = useNavigate();
  const { profile, isAdmin } = useAuth();

  const handleLogout = async () => {
    await logOut();
    navigate(portal === "employee" ? "/employee-login" : "/customer-login");
  };

  const roleLabel = profile?.isSuperAdmin
    ? "Super Admin"
    : isAdmin
    ? "Admin"
    : portal === "employee"
    ? "Employee"
    : "Customer";

  const initial = (profile?.name || "?").trim().charAt(0).toUpperCase();

  return (
    <aside className="sidebar">
      <Link to="/" className="sidebar-brand">
        <div className="brand-icon">CG</div>
        <div className="logo">
          CreditGuard <span>AI</span>
        </div>
      </Link>

      <div className="sidebar-account">
        <span className="sidebar-avatar">{initial}</span>
        <div>
          <strong>{profile?.name || "Account"}</strong>
          <small>{roleLabel}</small>
        </div>
      </div>

      <nav className="sidebar-nav">
        {portal === "employee" ? (
          <>
            <NavLink to="/employee-dashboard" end>
              <GaugeIcon />
              <span>Assess</span>
            </NavLink>
            <NavLink to="/employee-history">
              <ClockIcon />
              <span>History</span>
            </NavLink>
            {isAdmin && (
              <NavLink to="/admin">
                <ShieldIcon />
                <span>Admin Panel</span>
              </NavLink>
            )}
          </>
        ) : (
          <>
            <NavLink to="/customer-dashboard" end>
              <GaugeIcon />
              <span>Assess</span>
            </NavLink>
            <NavLink to="/customer-profile">
              <UserIcon />
              <span>My Profile</span>
            </NavLink>
          </>
        )}
      </nav>

      <div className="sidebar-footer">
        <button type="button" className="sidebar-logout" onClick={handleLogout}>
          <LogoutIcon />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
