export type NotificationType = 'success' | 'danger' | 'warning' | 'info' | 'primary' | 'link';
export function showNotification(message: string, type: NotificationType = 'success') {
  const notification = document.createElement('div');
  notification.className = `notification is-${type} top-centered-notification`;
  notification.innerHTML = `
    <button class="delete"></button>
    ${message}
  `;

  // Automatically remove the notification after 5 seconds
  const autoRemoveTimeout = setTimeout(() => {
    notification.parentNode?.removeChild(notification);
  }, 5000);

  // Add the event listener to the delete button
  notification.querySelector('.delete')?.addEventListener('click', () => {
    notification.parentNode?.removeChild(notification);
    clearTimeout(autoRemoveTimeout);
  });

  document.body.appendChild(notification);
}
