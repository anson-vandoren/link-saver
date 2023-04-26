import {
  API_URL,
  showNotification,
  loadLinks,
} from './common.js';

function loginDropdownHandler() {
  const loginForm = document.getElementById('login-dropdown');
  const usernameField = document.getElementById('login-username');

  loginForm.addEventListener('click', (e) => {
    if (e.target.classList.contains('navbar-link')) {
      loginForm.classList.toggle('is-active');

      // focus the username field when the login dropdown is active
      if (loginForm.classList.contains('is-active')) {
        usernameField.focus();
      }
    }
  });
}

async function loginSubmit(e) {
  e.preventDefault();
  const loginForm = document.getElementById('login-form');
  const usernameField = document.getElementById('login-username');
  const password = document.getElementById('login-password').value;

  const response = await fetch(`${API_URL}/api/users/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username: usernameField.value, password }),
  });

  if (response.ok) {
    const { token } = await response.json();
    localStorage.setItem('token', token);
    window.location.href = 'bookmarks.html';
  } else {
    showNotification('Error logging in. Please check your credentials.', 'is-danger');
    loginForm.reset();
    usernameField.focus(); // focus the username field after resetting the form
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loginDropdownHandler();
  const loginForm = document.getElementById('login-form');
  loginForm.addEventListener('submit', loginSubmit);
  loadLinks();
});
