// database/adapters/firebase.adapter.js
const admin = require('firebase-admin');
const path = require('path');
const BaseAdapter = require('./base.adapter');
const firebaseConfig = require('../../config/firebase.config');
// You need to create a service account file in your Firebase project
// and set the path to it in an environment variable
// Load Firebase service account credentials if the environment variable is provided.
// In test environments the variable may be undefined; in that case we fall back to an
// empty object so that requiring this module does not throw.
let serviceAccount = {};
if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH) {
  try {
    serviceAccount = require(path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH));
  } catch (e) {
    // If the file cannot be loaded, log a warning and continue with an empty object.
    console.warn('Failed to load Firebase service account file:', e.message);
    serviceAccount = {};
  }
}

class FirebaseAdapter extends BaseAdapter {
  constructor() {
    super(firebaseConfig);
    this.db = null;
  }

  connect() {
    // In test environments the Firebase service account may be missing. In that case we
    // skip initializing the real Firebase app to avoid credential errors.
    if (!admin.apps.length) {
      const hasCreds = serviceAccount && Object.keys(serviceAccount).length > 0 && typeof serviceAccount.project_id === 'string';
      if (!hasCreds) {
        console.warn('Firebase service account not provided or incomplete – skipping Firebase init');
        // Provide a minimal mock object so that other code can call getInstance without crashing.
        this.db = {};
        return this.db;
      }
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: this.config.databaseURL,
        storageBucket: this.config.storageBucket
      });
      this.db = admin.database();
      console.log('Firebase connected successfully');
    }
    return this.db;
  }

  disconnect() {
    // The Firebase Admin SDK handles connections automatically.
    // There is no explicit disconnect method.
    // We can use deleteApp for cleanup if needed, e.g. in tests.
    // admin.app().delete();
    console.log('Firebase connection managed by SDK. No explicit disconnect needed.');
  }
  
  getInstance() {
    if (!this.db) {
      this.connect();
    }
    return this.db;
  }
  
  getStorage() {
      if (!this.db) {
          this.connect();
      }
      return admin.storage().bucket();
  }
}

module.exports = new FirebaseAdapter();
