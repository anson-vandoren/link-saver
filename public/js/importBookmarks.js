import wsHandler from './ws.js';

import showNotification from './notification.js';

async function importBookmarks(file) {
  const formData = new FormData();
  formData.append('file', file);

  const progress = document.getElementById('import-progress');
  progress.classList.remove('is-hidden');

  wsHandler.on('import-progress', (data) => {
    progress.setAttribute('value', data.progress);
  });

  const response = await fetch('/api/links/import', {
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

const fileInput = document.querySelector('#import-bookmarks-file input[type=file]');
const importButton = document.getElementById('import-btn');

importButton.addEventListener('click', async (e) => {
  e.preventDefault();
  const file = fileInput.files[0];
  if (!file) {
    showNotification('Please select a file to import.', 'warning');
    return;
  }

  try {
    await importBookmarks(file);
  } catch (error) {
    showNotification('Failed to import bookmarks. Check server logs for more details', 'danger');
  }
  fileInput.value = '';
  importButton.disabled = true;
});
