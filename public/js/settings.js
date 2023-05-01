import { API_URL, showNotification, handleLogoutButtonClick } from './common.js';
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
    showNotification('Please select a file to import.', 'warning');
    return;
  }

  try {
    await importBookmarks(file);
  } catch (error) {
    console.error('Failed to import bookmarks:', error);
    showNotification('Failed to import bookmarks. Check logs for more details', 'danger');
  }
  fileInput.value = '';
  importButton.disabled = true;
});

async function exportBookmarks() {
  try {
    const response = await fetch(`${API_URL}/api/links/export`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });

    if (!response.ok) {
      throw new Error('Error exporting bookmarks');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bookmarks.html';
    document.body.appendChild(a);
    a.click();
    a.remove();
  } catch (error) {
    console.error('Error exporting bookmarks:', error.message);
  }
}

async function fetchThemes() {
  const response = await fetch('https://jenil.github.io/bulmaswatch/api/themes.json');
  const data = await response.json();
  return data.themes;
}

async function populateThemeDropdown() {
  const themes = await fetchThemes();
  const themeSelector = document.getElementById('theme-selector');

  // Retrieve the current theme from local storage or use the default theme
  const currentTheme = localStorage.getItem('selectedTheme') || 'https://unpkg.com/bulmaswatch@0.8.1/darkly/bulmaswatch.min.css';

  themes.forEach((theme) => {
    const option = document.createElement('option');
    option.value = theme.css;
    option.textContent = theme.name;

    // If the theme matches the current theme, set the option as selected
    if (theme.css === currentTheme) {
      option.selected = true;
    }

    themeSelector.appendChild(option);
  });
}

function saveThemeHandler() {
  const themeSelector = document.getElementById('theme-selector');

  themeSelector.addEventListener('change', (event) => {
    const selectedTheme = event.target.value;
    const stylesheetLink = document.getElementById('theme-stylesheet');
    stylesheetLink.href = selectedTheme;
    localStorage.setItem('selectedTheme', selectedTheme);
  });
}

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

async function handlePurgeUnusedTags() {
  try {
    const response = await fetch('/api/tags/purge-unused', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });

    if (response.ok) {
      showNotification('Unused tags have been purged.', 'success');
    } else {
      const errorData = await response.json();
      console.warn('Error purging unused tags:', errorData.error.message);
      showNotification('An error occurred while purging unused tags. Please try again later.', 'warning');
    }
  } catch (error) {
    console.error('Error purging unused tags:', error);
    showNotification('An error occurred while purging unused tags. Please try again later.', 'warning');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  fileInput.onchange = () => {
    if (fileInput.files.length > 0) {
      const fileName = document.querySelector('#import-bookmarks-file .file-name');
      fileName.textContent = fileInput.files[0].name;
      importButton.disabled = false;
    }
  };
  document.getElementById('logout-btn').addEventListener('click', handleLogoutButtonClick);
  const exportBtn = document.getElementById('export-btn');
  exportBtn.addEventListener('click', () => {
    exportBookmarks();
  });
  populateThemeDropdown();
  saveThemeHandler();
  const changePasswordForm = document.getElementById('change-password-form');
  changePasswordForm.addEventListener('submit', handleChangePasswordSubmit);
  document.getElementById('purge-tags-btn').addEventListener('click', handlePurgeUnusedTags);
});
