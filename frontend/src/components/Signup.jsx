import { useState } from "react";
import { FiBriefcase, FiLock, FiMail, FiPhone, FiUser } from "react-icons/fi";
import { NavLink, useNavigate } from "react-router-dom";
import Alert from "./Alert";
import AuthLayout from "./AuthLayout";
import { AuthField, AuthPasswordField, AuthSubmitButton } from "./AuthFields";
import { useFirebase } from "../context/firebase";
import { useUser } from "../context/UserContext";

const dashboardForUser = (user) => {
  if (user?.permissions?.canViewDashboard) return "/admin";
  if (user?.role === "employee") return "/employee";
  if (user?.role === "accounts") return "/projects";
  return "/tasks";
};

const Signup = () => {
  const { refreshUser } = useUser();
  const navigate = useNavigate();
  const { formatFirebaseError, login, signup } = useFirebase();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    contact: "",
    designation: "",
    organizationName: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState({ message: "", type: "info" });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const completeSignup = async () => {
    const profile = await refreshUser({
      contact: formData.contact,
      designation: formData.designation,
      fullName: formData.fullName,
      organizationName: formData.organizationName,
    });
    navigate(dashboardForUser(profile), { replace: true });
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setNotice({ message: "", type: "info" });

    if (formData.password.length < 12) {
      setNotice({ type: "error", message: "Password must be at least 12 characters." });
      setIsSubmitting(false);
      return;
    }

    try {
      try {
        await signup(formData);
      } catch (signupError) {
        if (signupError?.code !== "auth/email-already-in-use") throw signupError;

        try {
          await login(formData.email, formData.password);
        } catch {
          throw signupError;
        }
      }
      await completeSignup();
    } catch (error) {
      setNotice({ type: "error", message: formatFirebaseError(error) });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      eyebrow="Get started"
      features={[
        "Super admin, admin, manager, HR, and custom roles",
        "Employees only see work connected to their account",
        "Projects, attendance, and progress in one workspace",
      ]}
      featuresTitle="Role control"
      footer={
        <>
          Already have an account?{" "}
          <NavLink className="font-bold text-emerald-700 transition hover:text-emerald-800" to="/login">
            Sign in
          </NavLink>
        </>
      }
      panelEyebrow="Start in minutes"
      panelText="Create the company, become the super admin, then invite your team into scoped dashboards."
      panelTitle="Start a workspace that already knows who can do what."
      subtitle="Start a 14-day trial and become the workspace super admin."
      title="Create workspace"
    >
      <form className="space-y-4" onSubmit={handleSignup}>
        <Alert message={notice.message} type={notice.type} />

        <AuthField
          icon={FiBriefcase}
          label="Company name"
          name="organizationName"
          onChange={handleChange}
          placeholder="Prime Dumpster LLC"
          required
          value={formData.organizationName}
        />

        <AuthField
          autoComplete="name"
          icon={FiUser}
          label="Full name"
          name="fullName"
          onChange={handleChange}
          placeholder="Your full name"
          required
          value={formData.fullName}
        />

        <AuthField
          autoComplete="email"
          icon={FiMail}
          label="Email address"
          name="email"
          onChange={handleChange}
          placeholder="name@company.com"
          required
          type="email"
          value={formData.email}
        />

        <AuthPasswordField
          autoComplete="new-password"
          icon={FiLock}
          label="Password"
          name="password"
          onChange={handleChange}
          placeholder="At least 12 characters"
          required
          value={formData.password}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <AuthField
            icon={FiPhone}
            label="Contact"
            name="contact"
            onChange={handleChange}
            placeholder="Optional"
            value={formData.contact}
          />

          <AuthField
            icon={FiBriefcase}
            label="Designation"
            name="designation"
            onChange={handleChange}
            placeholder="Founder"
            value={formData.designation}
          />
        </div>

        <div className="pt-1">
          <AuthSubmitButton disabled={isSubmitting} loading={isSubmitting} loadingLabel="Creating workspace...">
            Create account
          </AuthSubmitButton>
        </div>

        <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-center text-xs leading-5 text-slate-500">
          This password is your super admin break-glass access. You and every member you invite sign in with a
          one-time email code.
        </p>
      </form>
    </AuthLayout>
  );
};

export default Signup;
