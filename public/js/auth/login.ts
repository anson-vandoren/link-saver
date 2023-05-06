import { doLogin } from '../apiClient';
import { showNotification } from '../notification';
import { getElementById } from '../utils';

export function handleLogin() {
  const loginDiv = getElementById('login-dropdown');
  const loginForm = getElementById('login-form', HTMLFormElement);
  const usernameField = getElementById('login-username', HTMLInputElement);
  const passwordField = getElementById('login-password', HTMLInputElement);

  // dropdown handler
  loginDiv.addEventListener('click', (e: Event) => {
    if (e.target instanceof HTMLElement && e.target.classList.contains('navbar-link')) {
      loginDiv.classList.toggle('is-active');

      if (loginDiv.classList.contains('is-active')) {
        usernameField.focus();
      }
    }
  });

  // submit handler
  loginForm.addEventListener('submit', (e: Event) => {
    e.preventDefault();
    doLogin(usernameField.value, passwordField.value)
      .then((response) => {
        if (response.token) {
          localStorage.setItem('token', response.token);
          window.location.href = 'bookmarks.html';
        } else {
          showNotification('Error logging in. Please check your credentials.', 'danger');
          usernameField.focus();
        }
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : 'Unknown error';
        showNotification(message, 'danger');
      })
      .finally(() => {
        loginForm.reset();
      });
  });
}
