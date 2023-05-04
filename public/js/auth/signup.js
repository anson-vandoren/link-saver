import { showNotification } from '../notification.js';

function handleSignupForm() {
  const signupForm = document.getElementById('signup-form');
  if (signupForm) {
    signupForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const submitButton = event.target.querySelector('button[type="submit"]');
      submitButton.disabled = true;

      const formData = new FormData(event.target);
      const username = formData.get('username');
      const password = formData.get('password');

      const response = await fetch('/api/users/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const { token, error } = await response.json();
      if (response.ok) {
        localStorage.setItem('token', token);
        window.location.href = 'bookmarks.html';
      } else {
        showNotification(error, 'error');
        submitButton.disabled = false;
      }
    });
  }
}

export { handleSignupForm };
