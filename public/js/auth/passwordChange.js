import { showNotification } from '../notification.js';

export async function handleChangePasswordSubmit(event) {
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
