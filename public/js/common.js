export const API_URL = 'http://localhost:3001';

const DEFAULT_PER_PAGE = 25;

/**
 * @typedef {Object} Link
 * @property {number} id
 * @property {string} url
 * @property {string} title
 * @property {string[]} tags
 * @property {boolean} isPublic
 * @property {string} savedAt
 * @property {number} userId
 */

export function showNotification(message, type = 'success') {
  const notification = document.createElement('div');
  notification.className = `notification is-${type} top-centered-notification`;
  notification.innerHTML = `
    <button class="delete"></button>
    ${message}
  `;

  // Automatically remove the notification after 5 seconds
  const autoRemoveTimeout = setTimeout(() => {
    notification.parentNode.removeChild(notification);
  }, 5000);

  // Add the event listener to the delete button
  notification.querySelector('.delete').addEventListener('click', () => {
    notification.parentNode.removeChild(notification);
    clearTimeout(autoRemoveTimeout);
  });

  document.body.appendChild(notification);
}

export function handleLogoutButtonClick() {
  localStorage.removeItem('token');
  window.location.href = '/';
}

/**
 * Fetch links from the API and render them in the DOM
 * @param {string} searchQuery optional search query to filter links
 * @throws {Error} if the request fails
 */
export async function loadLinks(searchQuery = '', page = 1, pageSize = DEFAULT_PER_PAGE) {
  // TODO: can we remove needing searchQuery as an arg?
  try {
    const { links, totalPages } = await getLinks(searchQuery, page, pageSize);
    const linkList = document.getElementById('link-list');
    linkList.innerHTML = '';

    links.forEach((link) => {
      const item = renderLinkItem(link);
      linkList.appendChild(item);
    });

    updatePagination(searchQuery, page, totalPages);
  } catch (err) {
    console.error('failed to load and render links', err);
    // go to / if not already there
    if (window.location.pathname !== '/') {
      window.location.href = '/';
    }
  }
}

/**
 * Fetch links from the API
 * @param {string} searchQuery optional search query to filter links
 * @returns {Promise<Link[]>} list of links
 * @throws {Error} if the request fails
 */
async function getLinks(searchQuery = '', page = 1, pageSize = DEFAULT_PER_PAGE) {
  const headers = { 'Content-Type': 'application/json' };

  const token = localStorage.getItem('token');
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const url = new URL(`${API_URL}/api/links`);
  url.searchParams.append('search', searchQuery);
  url.searchParams.append('page', page);
  url.searchParams.append('pageSize', pageSize);

  const response = await fetch(url.toString(), { headers });

  if (response.ok) {
    const res = await response.json();

    return {
      links: res.links,
      totalPages: res.totalPages,
    };
  }
  throw new Error('Failed to load links');
}

/**
 * Create a link list item element
 * @param {Link} link One link object to render
 * @returns Link list item element
 */
function renderLinkItem(link) {
  const linkItemTemplate = document.getElementById('link-item-template');
  const fragment = linkItemTemplate.content.cloneNode(true);
  const linkItem = fragment.querySelector('.link-item');
  linkItem.dataset.id = link.id;

  const titleLink = linkItem.querySelector('.link-item-title > a');
  titleLink.href = link.url;
  titleLink.textContent = link.title;

  const tagsSpan = linkItem.querySelector('.link-item-tags-description > span:first-child');
  if (link.tags.length && link.tags[0] !== '') {
    link.tags.forEach((tag) => {
      tagsSpan.appendChild(createTagLink(tag));
    });
  }

  const descrSpan = linkItem.querySelector('.link-item-tags-description > span:last-child');
  descrSpan.textContent = link.description ? link.description : '';

  if (link.tags.length && link.tags[0] !== '' && link.description) {
    tagsSpan.insertAdjacentText('beforeend', ' | ');
  }

  const dateSpan = linkItem.querySelector('.link-item-date-actions > span:first-child');
  const dateAgo = timeAgo(new Date(link.savedAt));

  const isLoggedIn = !!link.userId;
  if (isLoggedIn) {
    dateSpan.textContent = `Saved ${dateAgo} | `;
    const editLink = linkItem.querySelector('.link-item-date-actions > span:last-child > a:first-child');
    editLink.addEventListener('click', async () => {
      const linkData = await getLink(link.id);
      showEditForm(linkData);
    });

    const removeLink = linkItem.querySelector('.link-item-date-actions > span:last-child > a:last-child');
    removeLink.addEventListener('click', () => {
      deleteLink(link.id).then(() => {
        loadLinks();
      });
    });
  } else {
    dateSpan.textContent = `Saved ${dateAgo} by ${link.User.username}`;
    const editRemoveSpan = linkItem.querySelector('.link-item-date-actions > span:last-child');
    editRemoveSpan.remove();
  }

  return fragment;
}

function createTagLink(tag) {
  const tagLink = document.createElement('a');
  tagLink.classList.add('has-text-info');
  const tagWithHash = `#${tag}`;
  tagLink.href = `/?search=${encodeURIComponent(tagWithHash)}`;
  tagLink.textContent = `#${tag} `;

  const searchInput = document.getElementById('search-input');
  tagLink.addEventListener('click', (e) => {
    e.preventDefault();
    searchInput.value = tagWithHash;
    doSearch(true);
  });

  return tagLink;
}

async function getLink(id) {
  const response = await fetch(`${API_URL}/api/links/${id}`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
  });

  if (response.ok) {
    return response.json();
  }
  throw new Error('Failed to load link');
}
const editLinkTemplate = document.getElementById('edit-link-template');
function showEditForm(link) {
  const editFormFragment = editLinkTemplate.content.cloneNode(true);

  editFormFragment.querySelector('#edit-link-form').dataset.id = link.id;
  editFormFragment.querySelector('#edit-link-title').value = link.title;
  editFormFragment.querySelector('#edit-link-url').value = link.url;
  editFormFragment.querySelector('#edit-link-tags').value = (link.tags ?? []).join(', ');
  const linkVisibility = link.isPublic ? 'public' : 'private';
  editFormFragment.querySelector(`#edit-link-visibility option[value="${linkVisibility}"]`).selected = true;

  const editForm = editFormFragment.querySelector('#edit-link-form');

  const linkItem = document.querySelector(`[data-id="${link.id}"]`).closest('.link-item');
  linkItem.appendChild(editFormFragment);

  editForm.addEventListener('submit', handleEditFormSubmit);
  document.getElementById('cancel-edit').addEventListener('click', () => {
    editForm.remove();
  });
}
async function handleEditFormSubmit(event) {
  event.preventDefault();

  const linkId = event.target.dataset.id;
  const title = document.getElementById('edit-link-title').value;
  const url = document.getElementById('edit-link-url').value;
  const tags = document
    .getElementById('edit-link-tags')
    .value.split(',')
    .map((tag) => tag.trim());
  const visibility = document.getElementById('edit-link-visibility').value;
  const isPublic = visibility === 'public';

  try {
    await updateLink(linkId, {
      title,
      url,
      tags,
      isPublic,
    });

    // Hide the edit form and reload the links
    closeEditForm();
    await loadLinks();
  } catch (error) {
    alert('Failed to update link. Please try again.');
  }
}
function closeEditForm() {
  const editForm = document.getElementById('edit-link-form');
  if (editForm) {
    editForm.remove();
  }
}

async function updateLink(id, data) {
  const response = await fetch(`${API_URL}/api/links/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('Failed to update link');
  }
}

async function deleteLink(id) {
  const response = await fetch(`${API_URL}/api/links/${id}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to delete link');
  }
}
function timeAgo(date) {
  const pluralizeAndConcat = (n, word) => {
    let newWord = word;
    if (n > 1) newWord = `${word}s`;
    return `${n} ${newWord} ago`;
  };

  const seconds = Math.floor((new Date() - date) / 1000);
  let interval = Math.floor(seconds / 31536000);
  if (interval >= 1) {
    return pluralizeAndConcat(interval, 'year');
  }

  interval = Math.floor(seconds / 2592000);
  if (interval >= 1) {
    return pluralizeAndConcat(interval, 'month');
  }
  interval = Math.floor(seconds / 86400);
  if (interval >= 1) {
    return pluralizeAndConcat(interval, 'day');
  }
  interval = Math.floor(seconds / 3600);
  if (interval >= 1) {
    return pluralizeAndConcat(interval, 'hour');
  }
  interval = Math.floor(seconds / 60);
  if (interval >= 1) {
    return pluralizeAndConcat(interval, 'minute');
  }
  interval = Math.floor(seconds);
  return pluralizeAndConcat(interval, 'second');
}

export async function doSearch(append = false) {
  const doAppend = typeof append === 'boolean' ? append : false;
  const searchInput = document.getElementById('search-input');
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

  searchInput.value = newQuery;
  const urlPath = newQuery.length > 0 ? `/bookmarks.html?search=${encodeURIComponent(newQuery)}` : '/bookmarks.html';
  window.history.pushState(null, '', urlPath);

  try {
    await loadLinks(newQuery);
  } catch (_err) {
    // Do nothing
  }
}

function createEllipsis() {
  const listItem = document.createElement('li');
  const ellipsis = document.createElement('span');
  ellipsis.classList.add('pagination-ellipsis');
  ellipsis.innerHTML = '&hellip;';
  listItem.appendChild(ellipsis);
  return listItem;
}

function createPaginationItem(pageNumber, currentPage) {
  const listItem = document.createElement('li');
  const paginationLink = document.createElement('a');
  paginationLink.classList.add('pagination-link');
  paginationLink.textContent = pageNumber;
  paginationLink.setAttribute('aria-label', `Goto page ${pageNumber}`);
  if (pageNumber === currentPage) {
    paginationLink.classList.add('is-current');
    paginationLink.setAttribute('aria-current', 'page');
  } else {
    paginationLink.addEventListener('click', () => {
      const searchQuery = document.getElementById('search-input').value.trim();
      loadLinks(searchQuery, pageNumber);
    });
  }
  listItem.appendChild(paginationLink);
  return listItem;
}

function updatePagination(searchQuery, currentPage, totalPages) {
  const paginationList = document.querySelector('.pagination-list');
  paginationList.innerHTML = '';

  const maxPagesToShow = 3; // Adjust this value to show more or fewer page buttons

  let startPage = Math.max(2, currentPage - Math.floor(maxPagesToShow / 2));
  const endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
  startPage = Math.max(2, endPage - maxPagesToShow + 1);

  // TODO: figure out how to replace an ellipsis with a page number so total number of elements is constant

  // always show the first page
  paginationList.appendChild(createPaginationItem(1, currentPage));

  if (startPage > 2) {
    paginationList.appendChild(createEllipsis());
  }

  for (let i = startPage; i <= endPage; i++) {
    const listItem = createPaginationItem(i, currentPage);
    paginationList.appendChild(listItem);
  }

  if (endPage < totalPages) {
    paginationList.appendChild(createEllipsis());
  }

  // Add event listeners for previous and next buttons
  const prevBtn = document.querySelector('.pagination-previous');
  const nextBtn = document.querySelector('.pagination-next');

  const prevBtnClone = prevBtn.cloneNode(true);
  const nextBtnClone = nextBtn.cloneNode(true);

  prevBtn.replaceWith(prevBtnClone);
  nextBtn.replaceWith(nextBtnClone);

  if (currentPage <= 1) {
    prevBtnClone.setAttribute('disabled', '');
  } else {
    prevBtnClone.removeAttribute('disabled');
    prevBtnClone.addEventListener('click', () => {
      loadLinks(searchQuery, currentPage - 1);
    });
  }

  if (currentPage >= totalPages) {
    nextBtnClone.setAttribute('disabled', '');
  } else {
    nextBtnClone.removeAttribute('disabled');
    nextBtnClone.addEventListener('click', () => {
      loadLinks(searchQuery, currentPage + 1);
    });
  }
}
