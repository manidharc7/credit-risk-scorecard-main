import { HashRouter, Routes, Route, Navigate } from "react-router-dom";

import "./App.css";

import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import { ThemeProvider } from "./context/ThemeContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { PageTransition } from "./components/PageTransition";

import Welcome from "./pages/welcome";
import EmployeeLogin from "./pages/employeeLogin";
import EmployeeSignup from "./pages/employeeSignup";
import EmployeeDashboard from "./pages/EmployeeDashboard";
import EmployeeHistory from "./pages/EmployeeHistory";
import AdminPanel from "./pages/AdminPanel";

import CustomerLogin from "./pages/customerLogin";
import CustomerSignup from "./pages/customerSignup";
import CustomerDashboard from "./pages/CustomerDashboard";
import CustomerProfile from "./pages/CustomerProfile";

function AppRoutes() {
  return (
    <PageTransition>
      <Routes>
        <Route path="/" element={<Welcome />} />

        <Route path="/employee-login" element={<EmployeeLogin />} />
        <Route path="/employee-signup" element={<EmployeeSignup />} />

        <Route
          path="/employee-dashboard"
          element={
            <ProtectedRoute role="employee">
              <EmployeeDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/employee-history"
          element={
            <ProtectedRoute role="employee">
              <EmployeeHistory />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute role="employee" requireAdmin>
              <AdminPanel />
            </ProtectedRoute>
          }
        />

        <Route path="/customer-login" element={<CustomerLogin />} />
        <Route path="/customer-signup" element={<CustomerSignup />} />

        <Route
          path="/customer-dashboard"
          element={
            <ProtectedRoute role="customer">
              <CustomerDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/customer-profile"
          element={
            <ProtectedRoute role="customer">
              <CustomerProfile />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </PageTransition>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <HashRouter>
            <AppRoutes />
          </HashRouter>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
