import { HashRouter, Routes, Route, Navigate } from "react-router-dom";

import Welcome from "./pages/welcome";
import EmployeeLogin from "./pages/employeeLogin";
import EmployeeSignup from "./pages/employeeSignup";
import EmployeeDashboard from "./pages/EmployeeDashboard";
import EmployeeHistory from "./pages/EmployeeHistory";

import CustomerLogin from "./pages/customerLogin";
import CustomerSignup from "./pages/customerSignup";
import CustomerDashboard from "./pages/CustomerDashboard";

function App() {
  return (
    <HashRouter>
      <Routes>

        <Route path="/" element={<Welcome />} />

        <Route
          path="/employee-login"
          element={<EmployeeLogin />}
        />

        <Route
          path="/employee-signup"
          element={<EmployeeSignup />}
        />

        <Route
          path="/employee-dashboard"
          element={<EmployeeDashboard />}
        />

        <Route
          path="/employee-history"
          element={<EmployeeHistory />}
        />

        <Route
          path="/customer-login"
          element={<CustomerLogin />}
        />

        <Route
          path="/customer-signup"
          element={<CustomerSignup />}
        />

        <Route
          path="/customer-dashboard"
          element={<CustomerDashboard />}
        />

        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />

      </Routes>
    </HashRouter>
  );
}

export default App;