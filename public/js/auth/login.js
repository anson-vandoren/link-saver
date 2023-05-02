import { showNotification } from '../common.js';

export function loginDropdownHandler() {
  const loginForm = document.getElementById('login-dropdown');
  const usernameField = document.getElementById('login-username');

  loginForm.addEventListener('click', (e) => {
    if (e.target.classList.contains('navbar-link')) {
      loginForm.classList.toggle('is-active');

      if (loginForm.classList.contains('is-active')) {
        usernameField.focus();
      }
    }
  });
}

export function loginSubmitHandler() {
  const loginForm = document.getElementById('login-form');

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const usernameField = document.getElementById('login-username');
    const password = document.getElementById('login-password').value;

    const response = await fetch('/api/users/login', {
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
      showNotification('Error logging in. Please check your credentials.', 'danger');
      loginForm.reset();
      usernameField.focus();
    }
  });
}
