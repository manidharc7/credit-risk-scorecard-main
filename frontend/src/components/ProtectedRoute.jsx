import { Navigate } from "react-router-dom";

import { useAuth } from "../context/useAuth";

function LoadingScreen() {
  return (
    <div className="route-loading">
      <span className="spinner" />
      <p>Loading your session...</p>
    </div>
  );
}

export function ProtectedRoute({ role, requireAdmin = false, children }) {
  const { loading, isAuthenticated, profile, isAdmin } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    const fallback = role === "employee" ? "/employee-login" : "/customer-login";
    return <Navigate to={fallback} replace />;
  }

  if (role && profile?.role !== role) {
    return <Navigate to="/" replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/employee-dashboard" replace />;
  }

  return children;
}
