export function updateSearch(append = false) {
  const doAppend = typeof append === 'boolean' ? append : false;
  const searchInput = document.getElementById('search-input');
  if (!(searchInput instanceof HTMLInputElement)) throw new Error('Search input not found');
  const query = searchInput.value.trim();
  const existingQuery = new URLSearchParams(window.location.search).get('search') || '';

  let newQuery = doAppend && existingQuery ? `${existingQuery} ${query}` : query;

  if (doAppend) {
    const tag = searchInput.value;
    const currentTags = existingQuery.split(' ').filter((term) => term.startsWith('#'));

    if (currentTags.includes(tag)) {
      newQuery = existingQuery; // Keep the existing query unchanged
    }
  }
  newQuery = newQuery.trim();

  searchInput.value = newQuery;
  // Update the URL
  const currentPath = window.location.pathname;
  const urlPath = newQuery.length > 0 ? `${currentPath}?search=${encodeURIComponent(newQuery)}` : currentPath;
  window.history.pushState(null, '', urlPath);
}

export function clearSearch() {
  const searchInput = document.getElementById('search-input');
  if (!(searchInput instanceof HTMLInputElement)) throw new Error('Search input not found');
  searchInput.value = '';
  const currentPath = window.location.pathname;
  // clear the search query from the URL
  const newPath = currentPath.split('?')[0];
  window.history.pushState(null, '', newPath);
}