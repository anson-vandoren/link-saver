import { handleLogin } from './auth/login';
import { handleLogoutButtonClick } from './auth/logout';
import { handleChangePasswordSubmit } from './auth/passwordChange';
import { handleSignupForm } from './auth/signup';
import { exportBookmarks } from './exportBookmarks';
import { handleImportButton } from './importBookmarks';
import { handleAddLinkFormSubmit, loadLinks, tagOnClick } from './links';
import initModals from './modals';
import { clearSearch, updateSearch } from './search';
import { handlePurgeUnusedTags } from './tags';
import { loadTags } from './tagsBar';
import { populateThemeDropdown, saveThemeHandler } from './theme';
import { hasToken, removeToken } from './utils';

function initBookmarks(): void {
  if (!hasToken()) {
    window.location.href = '/';
  }

  // Event listeners
  document.getElementById('search-button')?.addEventListener('click', () => {
    updateSearch();
    loadLinks();
  });
  document.getElementById('search-input')?.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') {
      updateSearch();
      loadLinks();
    }
  });

  document.getElementById('logout-btn')?.addEventListener('click', handleLogoutButtonClick);
  document.getElementById('add-link-form')?.addEventListener('submit', handleAddLinkFormSubmit);
  document.getElementById('bookmarks-title')?.addEventListener('click', (e) => {
    e.preventDefault();
    clearSearch();
    loadLinks();
  });
  document.getElementById('add-link-save-btn')?.addEventListener('click', () => {
    // TODO: this loses form validation...
    document.getElementById('add-link-form')?.dispatchEvent(new Event('submit'));
  });
  initModals();
  loadLinks();
  updateSearch(true);
}

function initSettings() {
  handleImportButton();
  const importButton = document.getElementById('import-btn');
  const fileInput = document.querySelector('#import-bookmarks-file input[type=file]');
  if (fileInput instanceof HTMLInputElement && importButton instanceof HTMLButtonElement) {
    fileInput.onchange = () => {
      if (fileInput.files && fileInput.files.length > 0) {
        const fileName = document.querySelector('#import-bookmarks-file .file-name');
        if (fileName) {
          fileName.textContent = fileInput.files[0].name;
        }
        importButton.disabled = false;
      }
    };
  }
  document.getElementById('logout-btn')?.addEventListener('click', handleLogoutButtonClick);
  const exportBtn = document.getElementById('export-btn');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      exportBookmarks();
    });
  }
  populateThemeDropdown();
  saveThemeHandler();
  document.getElementById('change-password-form')?.addEventListener('submit', handleChangePasswordSubmit);
  document.getElementById('purge-tags-btn')?.addEventListener('click', handlePurgeUnusedTags);
}

document.addEventListener('DOMContentLoaded', () => {
  if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
    if (hasToken()) {
      window.location.href = '/bookmarks.html';
    }
    document.getElementById('bookmarks-title')?.addEventListener('click', (e) => {
      e.preventDefault();
      clearSearch();
      loadLinks();
    });
    handleLogin();
    loadLinks();
  } else if (window.location.pathname === '/signup.html') {
    if (hasToken()) {
      removeToken();
    }
    handleSignupForm();
  } else if (window.location.pathname === '/bookmarks.html') {
    initBookmarks();
  } else if (window.location.pathname === '/settings.html') {
    initSettings();
  }
});
