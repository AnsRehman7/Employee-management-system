import { useState } from "react";
import { FiArrowLeft, FiMail } from "react-icons/fi";
import { NavLink } from "react-router-dom";
import Alert from "./Alert";
import AuthLayout from "./AuthLayout";
import { AuthField, AuthSubmitButton } from "./AuthFields";
import { useFirebase } from "../context/firebase";

const ForgotPassword = () => {
  const { formatFirebaseError, sendResetPassword } = useFirebase();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState({ message: "", type: "info" });

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setNotice({ message: "", type: "info" });

    try {
      await sendResetPassword(email);
      setNotice({
        type: "success",
        message: "Password reset instructions have been sent to your email.",
      });
    } catch (error) {
      setNotice({ type: "error", message: formatFirebaseError(error) });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      eyebrow="Account recovery"
      features={[
        "Password sign-in is reserved for the super admin",
        "Everyone else signs in with a one-time email code",
        "Every sign-in is recorded in the audit log",
      ]}
      featuresTitle="Access control"
      footer={
        <NavLink
          className="inline-flex items-center gap-1.5 font-bold text-emerald-700 transition hover:text-emerald-800"
          to="/login"
        >
          <FiArrowLeft className="h-3.5 w-3.5" />
          Back to sign in
        </NavLink>
      }
      panelEyebrow="Stay in control"
      panelText="Reset your super admin password, or head back and sign in with a one-time code instead."
      panelTitle="Get back into your workspace safely."
      subtitle="We will email a reset link to your super admin address."
      title="Reset your password"
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <Alert message={notice.message} type={notice.type} />

        <AuthField
          autoComplete="email"
          icon={FiMail}
          label="Email address"
          name="email"
          onChange={(event) => setEmail(event.target.value)}
          placeholder="name@company.com"
          required
          type="email"
          value={email}
        />

        <AuthSubmitButton disabled={isSubmitting} loading={isSubmitting} loadingLabel="Sending link...">
          Send reset link
        </AuthSubmitButton>
      </form>
    </AuthLayout>
  );
};

export default ForgotPassword;
