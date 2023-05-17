import { showNotification } from './notification';
import { getElementById, querySelector } from './utils';
import { wsHandler } from './ws';
import { importBookmarks } from './apiClient';

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

async function doImportBookmarks(file: File) {
  const progress = getElementById('import-progress', HTMLProgressElement);
  progress.classList.remove('is-hidden');

  wsHandler.on('import-progress', (data: unknown) => {
    if (!isImportProgressData(data)) {
      throw new Error('Invalid data received for import-progress event');
    }
    progress.setAttribute('value', `${data.progress}`);
  });

  try {
    const base64EncodedFile = await readFileAsDataURL(file);
    await importBookmarks(base64EncodedFile);
    showNotification('Bookmarks imported successfully.');
  } catch (err) {
    console.debug(err);
  } finally {
    wsHandler.off('import-progress');
    progress.classList.add('is-hidden');
  }
}

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const result = reader.result as string;
      const base64Data = result.split(',')[1]; // Remove the MIME type prefix
      resolve(base64Data);
    };

    reader.onerror = () => {
      reader.abort();
      reject(new Error('Error reading file'));
    };

    reader.readAsDataURL(file);
  });
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

  await doImportBookmarks(file);

  fileInput.value = '';
  importButton.disabled = true;
}

export function handleImportButton() {
  const importButton = getElementById('import-btn', HTMLButtonElement);
  importButton.addEventListener('click', (e: Event) => {
    importBtnListener(e)
      .then(() => {
        showNotification('Bookmarks imported successfully.');
        window.location.href = './bookmarks.html';
      })
      .catch((_err) => {
        showNotification('Failed to import bookmarks. Check server logs for more details', 'danger');
      });
  });
}
