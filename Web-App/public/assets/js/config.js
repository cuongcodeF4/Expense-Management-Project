// TODO: Replace with your Firebase project config
// Get this from Firebase Console → Project Settings → Your apps → Web app
const firebaseConfig = {
  apiKey: "AIzaSyAPFntfD7LCsaWjhN7r6X2mAbKWcpfc7yI",
  authDomain: "money-management-b3eab.firebaseapp.com",
  projectId: "money-management-b3eab",
  storageBucket: "money-management-b3eab.firebasestorage.app",
  messagingSenderId: "335826420413",
  appId: "1:335826420413:web:89c6cffeaed91f9f566dd4",
  measurementId: "G-VPLJGN5CG6"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// Enable offline persistence for PWA support
db.enablePersistence().catch(err => {
  if (err.code === 'failed-precondition') {
    console.warn('Offline persistence: multiple tabs open');
  } else if (err.code === 'unimplemented') {
    console.warn('Offline persistence: browser not supported');
  }
});
