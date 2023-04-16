import { API_URL } from './common.js';

/**
 * Submits a form with the provided event, path, and error message.
 * @param {Event} e - The form submission event.
 * @param {string} path - The API path for the request ('login' or 'register').
 * @param {string} errorMessage - The error message to display upon failure.
 * @returns {Promise<void>}
 */
async function submitForm(e, path, errorMessage) {
  e.preventDefault();
  const username = document.getElementById(`${path}-username`).value;
  const password = document.getElementById(`${path}-password`).value;

  const response = await fetch(`${API_URL}/api/users/${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password }),
  });

  if (response.ok) {
    const { token } = await response.json();
    localStorage.setItem('token', token);
    window.location.href = 'index.html';
  } else {
    alert(errorMessage);
  }
}

/**
 * Handles the login form submission.
 * @param {Event} e - The form submission event.
 * @returns {Promise<void>}
 */
function loginSubmit(e) {
  submitForm(e, 'login', 'Error logging in. Please check your credentials.');
}

/**
 * Handles the register form submission.
 * @param {Event} e - The form submission event.
 * @returns {Promise<void>}
 */
function registerSubmit(e) {
  submitForm(e, 'register', 'Error registering. Please try again.');
}

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login-form');
  loginForm.addEventListener('submit', loginSubmit);

  const registerForm = document.getElementById('register-form');
  registerForm.addEventListener('submit', registerSubmit);
});
