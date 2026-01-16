// database/adapters/firebase.adapter.js
const admin = require('firebase-admin');
const path = require('path');
const BaseAdapter = require('./base.adapter');
const firebaseConfig = require('../../config/firebase.config');
// You need to create a service account file in your Firebase project
// and set the path to it in an environment variable
const serviceAccount = require(path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH));

class FirebaseAdapter extends BaseAdapter {
  constructor() {
    super(firebaseConfig);
    this.db = null;
  }

  connect() {
    if (!admin.apps.length) {
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
