const admin = require('firebase-admin');
const path = require('path');
let firebaseApp = null;

const initFirebase = () => {
  if (firebaseApp) return firebaseApp;
  try {
    const sa = require(path.join(__dirname, '../../firebase-service-account.json'));
    firebaseApp = admin.initializeApp({ credential: admin.credential.cert(sa) });
    console.log('Firebase Admin initialized');
    return firebaseApp;
  } catch (error) {
    console.warn('Firebase not configured - push notifications disabled');
    return null;
  }
};

module.exports = { initFirebase, admin };