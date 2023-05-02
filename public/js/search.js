import { doSearch } from './common.js';

function setInitialSearch() {
  const searchQuery = new URLSearchParams(window.location.search).get('search') || '';
  document.getElementById('search-input').value = searchQuery;

  if (searchQuery) {
    doSearch();
  }
}

export default setInitialSearch;
