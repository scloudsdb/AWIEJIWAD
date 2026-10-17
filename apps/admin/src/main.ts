// @ts-ignore — Firebase loaded from CDN importmap
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
} from 'firebase/auth';
import { auth } from './firebase';

// ─── Element refs ────────────────────────────────────────────────────────────
const loadingOverlay = document.getElementById('loading-overlay') as HTMLDivElement;
const loginView      = document.getElementById('login-view') as HTMLDivElement;
const dashboardView  = document.getElementById('dashboard-view') as HTMLDivElement;

const loginForm      = document.getElementById('login-form') as HTMLFormElement;
const emailInput     = document.getElementById('email-input') as HTMLInputElement;
const passwordInput  = document.getElementById('password-input') as HTMLInputElement;
const rememberMe     = document.getElementById('remember-me') as HTMLInputElement;
const togglePassword = document.getElementById('toggle-password') as HTMLButtonElement;
const eyeIcon        = document.getElementById('eye-icon') as SVGElement;
const eyeOffIcon     = document.getElementById('eye-off-icon') as SVGElement;
const loginError     = document.getElementById('login-error') as HTMLDivElement;
const loginBtn       = document.getElementById('login-btn') as HTMLButtonElement;
const loginBtnText   = document.getElementById('login-btn-text') as HTMLSpanElement;
const loginBtnSpinner= document.getElementById('login-btn-spinner') as HTMLSpanElement;

// ─── Helpers ─────────────────────────────────────────────────────────────────
function showView(view: 'loading' | 'login' | 'dashboard'): void {
  loadingOverlay.classList.toggle('hidden', view !== 'loading');
  loginView.classList.toggle('hidden', view !== 'login');
  dashboardView.classList.toggle('hidden', view !== 'dashboard');
}

function showLoginError(msg: string): void {
  loginError.textContent = msg;
  loginError.classList.remove('hidden');
}

function hideLoginError(): void {
  loginError.classList.add('hidden');
  loginError.textContent = '';
}

function setLoginLoading(loading: boolean): void {
  loginBtn.disabled = loading;
  loginBtnText.classList.toggle('hidden', loading);
  loginBtnSpinner.classList.toggle('hidden', !loading);
}

function friendlyAuthError(code: string): string {
  const map: Record<string, string> = {
    'auth/invalid-email':        'Format email tidak valid.',
    'auth/user-not-found':       'Akun tidak ditemukan.',
    'auth/wrong-password':       'Password salah. Coba lagi.',
    'auth/invalid-credential':   'Email atau password salah.',
    'auth/too-many-requests':    'Terlalu banyak percobaan. Coba lagi nanti.',
    'auth/network-request-failed':'Gagal terhubung. Periksa koneksi internet.',
    'auth/user-disabled':        'Akun ini telah dinonaktifkan.',
  };
  return map[code] ?? `Terjadi kesalahan (${code}).`;
}

// ─── Password toggle ──────────────────────────────────────────────────────────
togglePassword.addEventListener('click', () => {
  const isPassword = passwordInput.type === 'password';
  passwordInput.type = isPassword ? 'text' : 'password';
  eyeIcon.classList.toggle('hidden', isPassword);
  eyeOffIcon.classList.toggle('hidden', !isPassword);
  togglePassword.setAttribute('aria-label', isPassword ? 'Sembunyikan password' : 'Tampilkan password');
});

// ─── Login form submit ────────────────────────────────────────────────────────
loginForm.addEventListener('submit', async (e: Event) => {
  e.preventDefault();
  hideLoginError();

  const email    = emailInput.value.trim();
  const password = passwordInput.value;

  if (!email || !password) {
    showLoginError('Isi email dan password terlebih dahulu.');
    return;
  }

  setLoginLoading(true);
  try {
    const persistence = rememberMe.checked
      ? browserLocalPersistence
      : browserSessionPersistence;

    await setPersistence(auth, persistence);
    await signInWithEmailAndPassword(auth, email, password);
    // onAuthStateChanged will handle the redirect to dashboard
  } catch (err: unknown) {
    const code = (err as { code?: string }).code ?? 'unknown';
    showLoginError(friendlyAuthError(code));
    setLoginLoading(false);
  }
});

// ─── Auth state observer ──────────────────────────────────────────────────────
showView('loading');

onAuthStateChanged(auth, async (user) => {
  if (user) {
    localStorage.setItem('ai3dlabs_auth', user.uid);
    // Dynamically load dashboard module
    showView('loading');
    try {
      await import('./admin');
      // admin.ts will call initDashboard() and manage visibility
      const topbarUser = document.getElementById('topbar-user');
      if (topbarUser) topbarUser.textContent = user.email ?? '';
      showView('dashboard');
    } catch (err) {
      console.error('Failed to load admin module:', err);
      showView('login');
    }
  } else {
    localStorage.removeItem('ai3dlabs_auth');
    setLoginLoading(false);
    showView('login');
  }
});
