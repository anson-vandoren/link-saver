import { loginDropdownHandler, loginSubmitHandler } from './auth/login.js';
import { handleLogoutButtonClick } from './auth/logout.js';
import { handleChangePasswordSubmit } from './auth/passwordChange.js';
import { handleSignupForm } from './auth/signup.js';
import { exportBookmarks } from './exportBookmarks.js';
import './importBookmarks.js';
import { handleAddLinkFormSubmit, loadLinks, tagOnClick } from './links.js';
import initModals from './modals.js';
import { updateSearch } from './search.js';
import { handlePurgeUnusedTags } from './tags.js';
import { loadTags } from './tagsBar.js';
import { populateThemeDropdown, saveThemeHandler } from './theme.js';

function initBookmarks() {
  if (localStorage.getItem('token')) {
    // Event listeners
    document.getElementById('search-button').addEventListener('click', () => {
      updateSearch();
      loadLinks();
    });
    document.getElementById('search-input').addEventListener('keyup', (e) => {
      if (e.key === 'Enter') {
        updateSearch();
        loadLinks();
      }
    });

    document.getElementById('logout-btn').addEventListener('click', handleLogoutButtonClick);
    document.getElementById('add-link-form').addEventListener('submit', handleAddLinkFormSubmit);
    initModals();
    loadLinks();
  } else {
    window.location.href = '/';
  }
  updateSearch(true);
  loadLinks();
  loadTags(tagOnClick);
}

function initSettings() {
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
}

document.addEventListener('DOMContentLoaded', () => {
  if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
    loginDropdownHandler();
    loginSubmitHandler();
    loadLinks();
    loadTags(tagOnClick);
  } else if (window.location.pathname === '/signup.html') {
    handleSignupForm();
  } else if (window.location.pathname === '/bookmarks.html') {
    initBookmarks();
  } else if (window.location.pathname === '/settings.html') {
    initSettings();
  }
});
