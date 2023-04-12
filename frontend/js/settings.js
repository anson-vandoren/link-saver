import { API_URL } from './common.js';
import { wsHandler } from './ws.js';

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
}

const importFileInput = document.getElementById('import-bookmarks-file');
const importButton = document.getElementById('import-btn');

importButton.addEventListener('click', async (e) => {
  e.preventDefault();
  const file = importFileInput.files[0];
  if (!file) {
    alert('Please select a file to import.');
    return;
  }

  try {
    await importBookmarks(file);
    alert('Bookmarks imported successfully.');
  } catch (error) {
    console.error('Failed to import bookmarks:', error);
    alert('Failed to import bookmarks. Please try again.');
  }
});