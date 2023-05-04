import { LoginUserResponse } from '../../../shared/apiTypes';
import { showNotification } from '../notification';

export function loginDropdownHandler() {
  const loginForm = document.getElementById('login-dropdown');
  if (!loginForm) {
    throw new Error('Could not find login dropdown');
  }
  const usernameField = document.getElementById('login-username');
  if (!usernameField) {
    throw new Error('Could not find username field');
  }

  loginForm.addEventListener('click', (e: Event) => {
    if (e.target instanceof HTMLElement && e.target.classList.contains('navbar-link')) {
      loginForm.classList.toggle('is-active');

      if (loginForm.classList.contains('is-active')) {
        usernameField.focus();
      }
    }
  });
}

async function handleLoginFormSubmit(event: Event) {
  event.preventDefault();
  const usernameField = document.getElementById('login-username');
  if (!(usernameField instanceof HTMLInputElement)) {
    throw new Error('Could not find username field');
  }
  const passwordField = document.getElementById('login-password');
  if (!(passwordField instanceof HTMLInputElement)) {
    throw new Error('Could not find password field');
  }
  const password = passwordField.value;

  const response = await fetch('/api/users/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username: usernameField.value, password }),
  });

  if (response.ok) {
    const { token } = await response.json() as LoginUserResponse;
    localStorage.setItem('token', token);
    window.location.href = 'bookmarks.html';
  } else {
    showNotification('Error logging in. Please check your credentials.', 'danger');
    usernameField.focus();
  }
}

export function loginSubmitHandler() {
  const loginForm = document.getElementById('login-form');
  if (!(loginForm instanceof HTMLFormElement)) {
    throw new Error('Could not find login form');
  }

  loginForm.addEventListener('submit', (e: Event) => {
    handleLoginFormSubmit(e).catch((error: unknown) => {
      const message = error instanceof Error ? error.message : 'Unknown error';
      showNotification(message, 'danger');
    }).finally(() => {
      loginForm.reset();
    });
  });
}
