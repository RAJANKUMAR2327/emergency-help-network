const admin = require('firebase-admin');
let firebaseApp = null;

const initFirebase = () => {
  if (firebaseApp) return firebaseApp;
  try {
    // On Railway: set FIREBASE_SERVICE_ACCOUNT env var to the full JSON string
    // Locally: can also use the JSON file
    let serviceAccount;
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    } else {
      // Fallback for local dev only — file should NOT be committed to repo
      serviceAccount = require('../../firebase-service-account.json');
    }
    firebaseApp = admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    console.log('Firebase Admin initialized');
    return firebaseApp;
  } catch (error) {
    console.warn('Firebase not configured - push notifications disabled:', error.message);
    return null;
  }
};

module.exports = { initFirebase, admin };
