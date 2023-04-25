import { API_URL } from './common.js';
import { wsHandler } from './ws.js';

const fileInput = document.querySelector('#import-bookmarks-file input[type=file]');
const importButton = document.getElementById('import-btn');

async function importBookmarks(file) {
  const formData = new FormData();
  formData.append('file', file);

  const progress = document.getElementById('import-progress');
  progress.classList.remove('is-hidden');

  wsHandler.on('import-progress', (data) => {
    progress.setAttribute('value', data.progress);
  });

  const response = await fetch(`${API_URL}/api/links/import`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
    body: formData,
  });

  wsHandler.off('import-progress');
  progress.classList.add('is-hidden');

  if (!response.ok) {
    throw new Error('Failed to import bookmarks');
  }

  // Show the success notification
  showNotification('Bookmarks imported successfully.');
}

importButton.addEventListener('click', async (e) => {
  e.preventDefault();
  const file = fileInput.files[0];
  if (!file) {
    alert('Please select a file to import.');
    return;
  }

  try {
    await importBookmarks(file);
  } catch (error) {
    console.error('Failed to import bookmarks:', error);
    alert('Failed to import bookmarks. Please try again.');
  }
  fileInput.value = '';
  importButton.disabled = true;
});

function showNotification(message, type = 'success') {
  const notification = document.createElement('div');
  notification.className = `notification is-${type} top-centered-notification`;
  notification.innerHTML = `
    <button class="delete"></button>
    ${message}
  `;

  // Add the event listener to the delete button
  notification.querySelector('.delete').addEventListener('click', () => {
    notification.parentNode.removeChild(notification);
  });

  document.body.appendChild(notification);

  // Automatically remove the notification after 5 seconds
  setTimeout(() => {
    notification.parentNode.removeChild(notification);
  }, 5000);
}

document.addEventListener('DOMContentLoaded', () => {
  fileInput.onchange = () => {
    if (fileInput.files.length > 0) {
      const fileName = document.querySelector('#import-bookmarks-file .file-name');
      fileName.textContent = fileInput.files[0].name;
      importButton.disabled = false;
    }
  };
});
