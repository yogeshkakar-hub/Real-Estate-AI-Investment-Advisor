// auth.js — Auth state management + login/register UI logic

const Auth = {
  TOKEN_KEY: 're_token',
  USER_KEY: 're_user',

  getToken() { return localStorage.getItem(this.TOKEN_KEY); },
  getUser() {
    try { return JSON.parse(localStorage.getItem(this.USER_KEY)); } catch { return null; }
  },
  isLoggedIn() { return !!this.getToken(); },

  save(token, user) {
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  },

  clear() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  },

  async login(email, password) {
    const data = await api.login(email, password);
    this.save(data.token, data.user);
    return data.user;
  },

  async register(name, email, password) {
    const data = await api.register(name, email, password);
    this.save(data.token, data.user);
    return data.user;
  },

  logout() {
    this.clear();
    window.app.showAuth();
  }
};

// Auth Form UI
function initAuthUI() {
  const loginTab = document.getElementById('auth-login-tab');
  const registerTab = document.getElementById('auth-register-tab');
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const authError = document.getElementById('auth-error');

  loginTab.addEventListener('click', () => {
    loginTab.classList.add('active');
    registerTab.classList.remove('active');
    loginForm.classList.remove('hidden');
    registerForm.classList.add('hidden');
    authError.textContent = '';
  });

  registerTab.addEventListener('click', () => {
    registerTab.classList.add('active');
    loginTab.classList.remove('active');
    registerForm.classList.remove('hidden');
    loginForm.classList.add('hidden');
    authError.textContent = '';
  });

  // Login form submission
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    authError.textContent = '';
    const btn = loginForm.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Signing in...';
    try {
      await Auth.login(email, password);
      window.app.initApp();
    } catch (err) {
      authError.textContent = err.message;
    } finally {
      btn.disabled = false;
      btn.textContent = 'Sign In';
    }
  });

  // Register form submission
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('reg-name').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;
    authError.textContent = '';
    const btn = registerForm.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Creating account...';
    try {
      await Auth.register(name, email, password);
      window.app.initApp();
    } catch (err) {
      authError.textContent = err.message;
    } finally {
      btn.disabled = false;
      btn.textContent = 'Create Account';
    }
  });
}

window.Auth = Auth;
window.initAuthUI = initAuthUI;
