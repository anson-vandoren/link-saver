import { showNotification } from '../notification';
import { getToken } from '../utils';

export async function handleChangePasswordSubmit(event: Event) {
  event.preventDefault();

  const newPasswordElem = document.getElementById('new-password');
  const confirmNewPasswordElem = document.getElementById('confirm-new-password');
  const currentPasswordElem = document.getElementById('current-password');

  if (!(newPasswordElem instanceof HTMLInputElement)) {
    throw new Error('Could not find new password input');
  }
  if (!(confirmNewPasswordElem instanceof HTMLInputElement)) {
    throw new Error('Could not find confirm new password input');
  }
  if (!(currentPasswordElem instanceof HTMLInputElement)) {
    throw new Error('Could not find current password input');
  }

  const newPassword = newPasswordElem.value;
  const confirmNewPassword = confirmNewPasswordElem.value;
  const currentPassword = currentPasswordElem.value;

  if (newPassword !== confirmNewPassword) {
    showNotification('New password and confirmation do not match. Please try again.', 'warning');
    return;
  }

  try {
    const response = await fetch('/api/users/change-password', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken()}`,
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
    const passwordChangeForm = document.getElementById('change-password-form');
    if (!(passwordChangeForm instanceof HTMLFormElement)) {
      throw new Error('Could not find password change form');
    }
    passwordChangeForm.reset();
  } catch (error) {
    showNotification('Failed to update password. Please try again.', 'danger');
  }
}
