import { API_URL } from './common.js';

async function submitForm(e, path, errorMessage) {
  e.preventDefault();
  const email = document.getElementById(`${path}-email`).value;
  const password = document.getElementById(`${path}-password`).value;

  const response = await fetch(`${API_URL}/api/users/${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  if (response.ok) {
    const { token } = await response.json();
    localStorage.setItem('token', token);
    window.location.href = 'index.html';
  } else {
    alert(errorMessage);
  }
}

function loginSubmit(e) {
  submitForm(e, 'login', 'Error logging in. Please check your credentials.');
}

function registerSubmit(e) {
  submitForm(e, 'register', 'Error registering. Please try again.');
}

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login-form');
  loginForm.addEventListener('submit', loginSubmit);

  const registerForm = document.getElementById('register-form');
  registerForm.addEventListener('submit', registerSubmit);
});
