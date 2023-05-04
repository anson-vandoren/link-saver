import { loadLinks, handleAddLinkFormSubmit, tagOnClick } from './links.js';
import { updateSearch } from './search.js';
import { loadTags } from './tagsBar.js';
import initModals from './modals.js';

import { handleLogoutButtonClick } from './auth/logout.js';

function init() {
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
}

document.addEventListener('DOMContentLoaded', () => {
  init();
  updateSearch(true);
  loadLinks();
  loadTags(tagOnClick);
});
