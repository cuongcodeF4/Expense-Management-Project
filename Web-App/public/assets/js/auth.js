// ═══════════════════════════════════════════════
//  AUTH — Google Sign-In
// ═══════════════════════════════════════════════

function signIn() {
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider).catch(err => showToast('Sign in failed: ' + err.message, 'error'));
}

function signOut() {
  auth.signOut().then(() => {
    window._appData = null;
    if (typeof _unsubscribe === 'function') _unsubscribe();
  });
}

let _authResolved = false;

auth.onAuthStateChanged(user => {
  // Hide loading screen on first auth state resolution
  if (!_authResolved) {
    _authResolved = true;
    document.getElementById('loading-screen').style.display = 'none';
  }

  if (user) {
    window._uid = user.uid;
    document.getElementById('login-screen').style.display = 'none';

    const nameEl = document.getElementById('user-name');
    const avatarEl = document.getElementById('user-avatar');
    if (nameEl) nameEl.textContent = user.displayName || user.email || '';
    if (avatarEl && user.photoURL) {
      avatarEl.src = user.photoURL;
      avatarEl.style.display = 'block';
    }

    initApp();
  } else {
    window._uid = null;
    document.getElementById('login-screen').style.display = 'flex';
  }
});
