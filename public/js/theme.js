// theme.js — Light/Dark mode manager for PropIQ
(function () {
  'use strict';
  const KEY = 'propiq_theme';
  const DEFAULT = 'dark';

  function applyTheme(theme, persist) {
    document.documentElement.setAttribute('data-theme', theme);
    if (persist) localStorage.setItem(KEY, theme);
    const btn = document.getElementById('theme-toggle');
    if (btn) btn.setAttribute('aria-label', theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode');
  }

  function toggleTheme() {
    const cur = document.documentElement.getAttribute('data-theme') || DEFAULT;
    applyTheme(cur === 'dark' ? 'light' : 'dark', true);
  }

  function init() {
    const saved = localStorage.getItem(KEY) || DEFAULT;
    applyTheme(saved, false);
    const btn = document.getElementById('theme-toggle');
    if (btn) btn.addEventListener('click', toggleTheme);
  }

  // Apply immediately to prevent flash of wrong theme
  applyTheme(localStorage.getItem(KEY) || DEFAULT, false);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.PropIQTheme = { apply: (t) => applyTheme(t, true), toggle: toggleTheme };
})();
