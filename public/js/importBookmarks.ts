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

async function doImportBookmarks(file: string) {
  const progress = getElementById('import-progress', HTMLProgressElement);
  progress.classList.remove('is-hidden');

  wsHandler.on('import-progress', (data: unknown) => {
    if (!isImportProgressData(data)) {
      throw new Error('Invalid data received for import-progress event');
    }
    progress.setAttribute('value', `${data.progress}`);
  });

  try {
    // base64 encode the file contents
    const utf8Encoder = new TextEncoder();
    const utf8EncodedFile = utf8Encoder.encode(file);
    const base64EncodedFile = btoa(String.fromCharCode(...utf8EncodedFile));
    await importBookmarks(base64EncodedFile);
    showNotification('Bookmarks imported successfully.');
  } finally {
    wsHandler.off('import-progress');
    progress.classList.add('is-hidden');
  }
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

  // Read the file contents as a string
  const fileContent = await new Promise<string>((resolve, reject) => {
    const fileReader = new FileReader();
    fileReader.onload = () => {
      const result = fileReader.result;
      if (typeof result === 'string') {
        resolve(result);
      } else {
        reject(new Error('Error reading the selected file.'));
      }
    };
    fileReader.onerror = () => {
      reject(new Error('Error reading the selected file.'));
    };
    fileReader.readAsText(file);
  });

  await doImportBookmarks(fileContent);

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
