import { doSearch, handleLogoutButtonClick, loadLinks, loadTags } from './common.js';
import initModals from './modals.js';
import handleAddLinkFormSubmit from './links.js';
import setInitialSearch from './search.js';

function init() {
  if (localStorage.getItem('token')) {
    // Event listeners
    document.getElementById('search-button').addEventListener('click', () => doSearch());
    document.getElementById('search-input').addEventListener('keyup', (e) => {
      if (e.key === 'Enter') {
        doSearch();
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
  setInitialSearch();
  loadTags();
});
