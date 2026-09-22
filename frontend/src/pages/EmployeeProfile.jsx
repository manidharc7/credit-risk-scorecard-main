import { Sidebar } from "../components/Sidebar";
import { AccountDetailsCard } from "../components/AccountDetailsCard";
import { useAuth } from "../context/useAuth";

function EmployeeProfile() {
  const { profile, isAdmin } = useAuth();

  const roleLabel = profile?.isSuperAdmin
    ? "Super Admin"
    : isAdmin
    ? "Admin"
    : "Employee";

  return (
    <div className="app">
      <Sidebar portal="employee" />

      <main className="container">
        <section className="hero">
          <div className="hero-content">
            <span className="eyebrow">YOUR ACCOUNT</span>

            <h1>
              My
              <span> Profile</span>
            </h1>

            <p>Your account details as registered with CreditGuard AI.</p>
          </div>
        </section>

        <AccountDetailsCard
          extraFields={[
            { label: "Employee ID", value: profile?.employeeId },
            { label: "Role", value: roleLabel },
          ]}
        />
      </main>
    </div>
  );
}

export default EmployeeProfile;
