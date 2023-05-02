import './importBookmarks.js';
import exportBookmarks from './exportBookmarks.js';
import { populateThemeDropdown, saveThemeHandler } from './theme.js';
import handlePurgeUnusedTags from './tags.js';
import handleLogoutButtonClick from './auth/logout.js';
import handleChangePasswordSubmit from './auth/passwordChange.js';

document.addEventListener('DOMContentLoaded', () => {
  const importButton = document.getElementById('import-btn');
  const fileInput = document.querySelector('#import-bookmarks-file input[type=file]');
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
