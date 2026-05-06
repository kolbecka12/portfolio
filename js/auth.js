/**
 * auth.js
 * Login, logout, session checking, and admin nav link visibility.
 */

/**
 * Checks if the user has an active session. If not, redirects to admin.html.
 * Call this at the top of pages that require authentication.
 */
async function requireAdmin() {
  const { data: { session } } = await window.SupabaseClient.auth.getSession();
  if (!session) {
    const redirect = encodeURIComponent(window.location.pathname);
    window.location.href = '/admin.html?redirect=' + redirect;
  }
  return session;
}

/**
 * Signs in with email and password.
 * On success, redirects to `redirect` query param or admin.html.
 */
async function login(email, password) {
  const { data, error } = await window.SupabaseClient.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    return { error: error.message };
  }

  const params = new URLSearchParams(window.location.search);
  const redirect = params.get('redirect') || '/admin.html';
  window.location.href = redirect;
  return { data };
}

/**
 * Signs out and redirects to homepage.
 */
async function logout() {
  await window.SupabaseClient.auth.signOut();
  window.location.href = '/index.html';
}

/**
 * Shows/hides the admin nav link based on session state.
 * Also initializes the mobile nav toggle.
 */
async function initNav() {
  // Mobile toggle
  const toggle = document.querySelector('.nav-toggle');
  const header = document.querySelector('.site-header');
  if (toggle && header) {
    toggle.addEventListener('click', () => {
      header.classList.toggle('nav-open');
    });
  }

  // Active nav link
  const links = document.querySelectorAll('.site-nav a[data-page]');
  const path = window.location.pathname;
  links.forEach(link => {
    const href = link.getAttribute('href');
    if (
      href === path ||
      (href !== '/index.html' && path.includes(href.replace('.html', '')))
    ) {
      link.classList.add('active');
    }
  });

  // Admin link is always visible — the login page handles security
  const adminLink = document.querySelector('.nav-admin');
  if (adminLink) {
    adminLink.style.display = 'inline';
  }
}
