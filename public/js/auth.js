import { showNotification } from './common.js';

async function handleFormSubmit(event) {
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
}

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('signup-form');
  form.addEventListener('submit', handleFormSubmit);
});

async function handleChangePasswordSubmit(event) {
  event.preventDefault();

  const newPassword = document.getElementById('new-password').value;
  const confirmNewPassword = document.getElementById('confirm-new-password').value;
  const currentPassword = document.getElementById('current-password').value;

  if (newPassword !== confirmNewPassword) {
    showNotification('New password and confirmation do not match. Please try again.', 'warning');
    return;
  }

  try {
    const response = await fetch('/api/users/change-password', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({
        newPassword,
        currentPassword,
      }),
    });

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    showNotification('Password updated successfully.');
    document.getElementById('change-password-form').reset();
  } catch (error) {
    showNotification('Failed to update password. Please try again.', 'danger');
  }
}

export default handleChangePasswordSubmit;
