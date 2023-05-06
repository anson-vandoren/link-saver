import { showNotification } from './notification';
import { getElementById, getToken, querySelector } from './utils';
import { wsHandler } from './ws';

interface ImportProgressData {
  progress: number;
}

function isImportProgressData(obj: unknown): obj is ImportProgressData {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'progress' in obj &&
    typeof (obj as ImportProgressData).progress === 'number'
  );
}

async function importBookmarks(file: string | Blob) {
  const formData = new FormData();
  formData.append('file', file);

  const progress = getElementById('import-progress', HTMLProgressElement);
  progress.classList.remove('is-hidden');

  wsHandler.on('import-progress', (data: unknown) => {
    if (!isImportProgressData(data)) {
      throw new Error('Invalid data received for import-progress event');
    }
    progress.setAttribute('value', `${data.progress}`);
  });

  const response = await fetch('/api/links/import', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${getToken()}`,
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

async function importBtnListener(e: Event) {
  const fileInput = querySelector('#import-bookmarks-file input[type=file]', HTMLInputElement);
  const importButton = getElementById('import-btn', HTMLButtonElement);
  e.preventDefault();
  const { files } = fileInput;
  if (!files) {
    showNotification('Please select a file to import.', 'warning');
    return;
  }
  const file = files[0];
  if (!file) {
    showNotification('Please select a file to import.', 'warning');
    return;
  }

  await importBookmarks(file);

  fileInput.value = '';
  importButton.disabled = true;
}

export function handleImportButton() {
  const importButton = getElementById('import-btn', HTMLButtonElement);
  importButton.addEventListener('click', (e: Event) => {
    importBtnListener(e).catch((_err) => {
      showNotification('Failed to import bookmarks. Check server logs for more details', 'danger');
    });
  });
}
