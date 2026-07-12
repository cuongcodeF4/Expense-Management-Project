// ═══════════════════════════════════════════════
//  AUTH — Google Sign-In
// ═══════════════════════════════════════════════

function signIn() {
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider).catch(err => showToast('Sign in failed: ' + err.message, 'error'));
}

async function signOut() {
  const button = document.getElementById('signout-btn');
  if (button) button.disabled = true;
  try {
    if (typeof flushPendingSave === 'function') await flushPendingSave();
    await auth.signOut();
  } catch (err) {
    showToast('Sign out failed: ' + err.message, 'error');
  } finally {
    if (button) button.disabled = false;
  }
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
    if (typeof resetAppDataState === 'function') resetAppDataState();
    window._uid = null;
    document.getElementById('login-screen').style.display = 'flex';
  }
});
