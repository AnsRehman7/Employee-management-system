import { FiAlertCircle, FiCheckCircle, FiInfo } from "react-icons/fi";

const styles = {
  error: {
    container: "border-rose-200 bg-rose-50 text-rose-800",
    icon: "text-rose-500",
    Icon: FiAlertCircle,
  },
  info: {
    container: "border-sky-200 bg-sky-50 text-sky-800",
    icon: "text-sky-500",
    Icon: FiInfo,
  },
  success: {
    container: "border-emerald-200 bg-emerald-50 text-emerald-800",
    icon: "text-emerald-500",
    Icon: FiCheckCircle,
  },
};

const Alert = ({ message, title, type = "info" }) => {
  if (!message && !title) return null;

  const tone = styles[type] || styles.info;
  const Icon = tone.Icon;

  return (
    <div className={`flex gap-3 rounded-lg border px-4 py-3 text-sm ${tone.container}`}>
      <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${tone.icon}`} aria-hidden="true" />
      <div>
        {title && <p className="font-semibold">{title}</p>}
        {message && <p className={title ? "mt-1" : ""}>{message}</p>}
      </div>
    </div>
  );
};

export default Alert;
