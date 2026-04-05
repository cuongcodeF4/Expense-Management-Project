// ═══════════════════════════════════════════════
//  AUTH — Google Sign-In (Android WebView build)
// ═══════════════════════════════════════════════

// Handle redirect result on app load (required for signInWithRedirect flow)
auth.getRedirectResult().then(result => {
  // sign-in via redirect is handled by onAuthStateChanged below
}).catch(err => {
  if (err.code !== 'auth/no-current-user') {
    console.error('Redirect sign-in error:', err.message);
  }
});

function signIn() {
  const provider = new firebase.auth.GoogleAuthProvider();

  // Force Google to show the account chooser
  provider.setCustomParameters({
    prompt: 'select_account'
  });

  // In Android WebView, use signInWithPopup.
  // The native side (MainActivity) handles popup windows via onCreateWindow.
  auth.signInWithPopup(provider).catch(err => {
    if (err && (err.code === 'auth/popup-blocked' || err.code === 'auth/popup-closed-by-user')) {
      // Fallback to redirect if popup fails
      console.log('Popup failed, trying redirect...');
      auth.signInWithRedirect(provider).catch(err2 => {
        showToast('Sign in failed: ' + err2.message, 'error');
      });
      return;
    }
    showToast('Sign in failed: ' + err.message, 'error');
  });
}

function signOut() {
  auth.signOut().then(() => {
    window._appData = null;
    if (typeof _unsubscribe === 'function') _unsubscribe();
    // Optional: Reload to clear any remaining state
    window.location.reload();
  });
}

let _authResolved = false;

auth.onAuthStateChanged(user => {
  // Hide loading screen on first auth state resolution
  if (!_authResolved) {
    _authResolved = true;
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) loadingScreen.style.display = 'none';
  }

  if (user) {
    window._uid = user.uid;
    const loginScreen = document.getElementById('login-screen');
    if (loginScreen) loginScreen.style.display = 'none';

    const nameEl = document.getElementById('user-name');
    const avatarEl = document.getElementById('user-avatar');
    if (nameEl) nameEl.textContent = user.displayName || user.email || '';
    if (avatarEl && user.photoURL) {
      avatarEl.src = user.photoURL;
      avatarEl.style.display = 'block';
    }

    initApp();

    // Xử lý các giao dịch MoMo đến khi chưa đăng nhập
    if (typeof processPendingMomoTransactions === 'function') {
      processPendingMomoTransactions();
    }
  } else {
    window._uid = null;
    const loginScreen = document.getElementById('login-screen');
    if (loginScreen) loginScreen.style.display = 'flex';
  }
});
