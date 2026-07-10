const dotenv = require("dotenv");

dotenv.config();

const toBoolean = (value, fallback = false) => {
  if (value === undefined) return fallback;
  return ["1", "true", "yes", "on"].includes(String(value).toLowerCase());
};

const csv = (value = "") =>
  value
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

const env = {
  allowClientRoleSelection: toBoolean(process.env.ALLOW_CLIENT_ROLE_SELECTION, false),
  bootstrapAdminEmails: csv(process.env.BOOTSTRAP_ADMIN_EMAILS),
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",
  databaseUrl:
    process.env.DATABASE_URL || "postgresql://postgres:postgre@localhost:5432/postgres?schema=public",
  firebaseClientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  firebasePrivateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  firebaseProjectId: process.env.FIREBASE_PROJECT_ID,
  firebaseServiceAccountJson: process.env.FIREBASE_SERVICE_ACCOUNT_JSON,
  geminiApiKey: process.env.GEMINI_API_KEY,
  geminiModel: process.env.GEMINI_MODEL || "gemini-3.5-flash",
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 4000),
};

const validateEnv = () => {
  const missing = [];

  if (!env.firebaseServiceAccountJson && !env.firebaseProjectId && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    missing.push("FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_PROJECT_ID/GOOGLE_APPLICATION_CREDENTIALS");
  }

  if (missing.length) {
    console.warn(`[env] Missing runtime config for authenticated routes: ${missing.join(", ")}`);
  }
};

module.exports = {
  env,
  validateEnv,
};
