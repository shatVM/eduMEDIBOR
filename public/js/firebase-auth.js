// Дозволити localhost для розвитку
//irebase.auth().settings.appVerificationDisabledForTesting = true;

// public/js/firebase-auth.js

// Firebase config injected from server-side .env
const firebaseConfig = {
  apiKey: "AIzaSyDswZJZLobfCmkt6OS-g_PezzQPc-h1QrA",
  authDomain: "dbtojson.firebaseapp.com",
  projectId: "dbtojson",
  storageBucket: "dbtojson.firebasestorage.app",
  messagingSenderId: "555403920595",
  appId: "1:555403920595:web:90db53778c4da7e3814026",
  databaseURL: "https://dbtojson.firebaseio.com"
};
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

window.googleLogin = function() {
  const provider = new firebase.auth.GoogleAuthProvider();
  firebase.auth().signInWithPopup(provider)
    .then(async result => {
      const idToken = await result.user.getIdToken();
      // Надсилаємо idToken на бекенд для отримання JWT
      fetch('/api/users/firebase-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ idToken })
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          $('#appModal').modal('hide');
          location.reload();
        } else {
          alert('Помилка авторизації: ' + (data.error || 'Невідома помилка'));
        }
      })
      .catch(() => alert('Помилка авторизації (мережа)'));
    })
    .catch(error => {
      alert('Google login error: ' + error.message);
    });
};
