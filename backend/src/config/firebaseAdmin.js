const { applicationDefault, cert, getApps, initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { env } = require("./env");

const getCredential = () => {
  if (env.firebaseServiceAccountJson) {
    return cert(JSON.parse(env.firebaseServiceAccountJson));
  }

  if (env.firebaseProjectId && env.firebaseClientEmail && env.firebasePrivateKey) {
    return cert({
      clientEmail: env.firebaseClientEmail,
      privateKey: env.firebasePrivateKey,
      projectId: env.firebaseProjectId,
    });
  }

  return applicationDefault();
};

const app =
  getApps()[0] ||
  initializeApp({
    credential: getCredential(),
    projectId: env.firebaseProjectId,
  });

module.exports = {
  firebaseAuth: getAuth(app),
};
