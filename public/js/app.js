// app.js — SPA router + global state + nav

function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

const pages = ['chat', 'dashboard', 'compare', 'wizard'];
let currentPage = 'chat';
let appInitialized = false;

function navigate(page) {
  if (!pages.includes(page)) page = 'chat';
  currentPage = page;

  // Update nav links
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.toggle('active', link.dataset.page === page);
  });

  // Show/hide panels
  document.querySelectorAll('.page-panel').forEach(panel => {
    panel.classList.toggle('active', panel.id === `page-${page}`);
  });

  // Init page modules lazily
  if (page === 'chat' && !appInitialized) {
    initChat();
    appInitialized = true;
  } else if (page === 'dashboard') {
    initDashboard();
  } else if (page === 'compare') {
    initCompare();
  } else if (page === 'wizard') {
    initWizard();
  }
}

function updateUserNav() {
  const user = Auth.getUser();
  const nameEl = document.getElementById('nav-user-name');
  if (nameEl && user) nameEl.textContent = user.name.split(' ')[0];
}

const app = {
  showAuth() {
    document.getElementById('auth-screen').classList.remove('hidden');
    document.getElementById('app-screen').classList.add('hidden');
  },

  initApp() {
    document.getElementById('auth-screen').classList.add('hidden');
    document.getElementById('app-screen').classList.remove('hidden');

    updateUserNav();

    // Nav clicks
    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        navigate(link.dataset.page);
      });
    });

    // Mobile nav toggle
    const navToggle = document.getElementById('nav-toggle');
    const sidebar = document.getElementById('sidebar');
    if (navToggle) {
      navToggle.addEventListener('click', () => sidebar.classList.toggle('open'));
    }

    // Logout
    document.getElementById('logout-btn').addEventListener('click', () => {
      if (confirm('Sign out?')) Auth.logout();
    });

    // Default page
    navigate('chat');
  }
};

window.app = app;
window.showToast = showToast;
window.navigate = navigate;

// Boot
document.addEventListener('DOMContentLoaded', () => {
  initAuthUI();

  if (Auth.isLoggedIn()) {
    app.initApp();
  } else {
    app.showAuth();
  }
});
