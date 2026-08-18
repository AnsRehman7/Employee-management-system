import { FiMoon, FiSun } from "react-icons/fi";
import { useTheme } from "../context/ThemeContext";

/**
 * Single source of truth for the light/dark switch so every surface that shows it
 * behaves and looks identically.
 */
const ThemeToggle = ({ className = "" }) => {
  const { isDark, toggleTheme } = useTheme();
  const label = isDark ? "Switch to light theme" : "Switch to dark theme";

  return (
    <button
      aria-label={label}
      aria-pressed={isDark}
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800 ${className}`}
      onClick={toggleTheme}
      title={label}
      type="button"
    >
      {isDark ? <FiSun className="h-4 w-4" /> : <FiMoon className="h-4 w-4" />}
    </button>
  );
};

export default ThemeToggle;
