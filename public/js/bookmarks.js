import { API_URL } from './common.js';
import { wsHandler } from './ws.js';
import { applyStoredTheme } from './theme.js';

document.addEventListener('DOMContentLoaded', () => {
  applyStoredTheme();
  init();
  setInitialSearch();
});

async function init() {
  if (localStorage.getItem('token')) {
    // Event listeners
    document.getElementById('add-link').addEventListener('click', showAddForm);
    document.getElementById('search-button').addEventListener('click', () => doSearch());
    document.getElementById('search-input').addEventListener('keyup', (e) => {
      if (e.key === 'Enter') {
        doSearch();
      }
    });

    document.getElementById('logout-btn').addEventListener('click', handleLogoutButtonClick);
    document.getElementById('add-link-form').addEventListener('submit', handleAddLinkFormSubmit);

    loadLinks();
  } else {
    window.location.href = '/login.html';
  }
}

function setInitialSearch() {
  const searchQuery = new URLSearchParams(window.location.search).get('search') || '';
  document.getElementById('search-input').value = searchQuery;

  if (searchQuery) {
    doSearch();
  }
}

async function doSearch(append = false) {
  append = typeof append === 'boolean' ? append : false;
  const searchInput = document.getElementById('search-input');
  const query = searchInput.value.trim();
  const existingQuery = new URLSearchParams(window.location.search).get('search') || '';

  let newQuery = append && existingQuery ? `${existingQuery} ${query}` : query;

  if (append) {
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
  } catch (error) {
    console.error(error);
    window.location.href = '/login.html';
  }
}


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

/**
 * Fetch links from the API
 * @param {string} searchQuery optional search query to filter links
 * @returns {Promise<Link[]>} list of links
 * @throws {Error} if the request fails
 */
async function getLinks(searchQuery = '') {
  const response = await fetch(`${API_URL}/api/links?search=${encodeURIComponent(searchQuery)}`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
  });

  if (response.ok) {
    const res = await response.json();
    return res.links;
  } else {
    throw new Error('Failed to load links');
  }
}

/**
 * Fetch links from the API and render them in the DOM
 * @param {string} searchQuery optional search query to filter links
 * @throws {Error} if the request fails
 */
async function loadLinks(searchQuery = '') {
  try {
    const links = await getLinks(searchQuery);
    const linkList = document.getElementById('link-list');
    linkList.innerHTML = '';

    links.forEach((link) => {
      const item = renderLinkItem(link);
      linkList.appendChild(item);
    });
  } catch (error) {
    console.error('Failed to load links:', error);
    window.location.href = '/login.html';
  }
}

/**
 * Create a div element with the given classes
 * @param {string[]} classes
 * @returns A div element with the given classes
 */
function divWithClasses(classes) {
  const div = document.createElement('div');
  div.classList.add(...classes);
  return div;
}

function timeAgo(date) {
  const pluralizeAndConcat = (n, word) => {
    if (n > 1) word = `${word}s`;
    return `${n} ${word} ago`;
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

/**
 * Create a link list item element
 * @param {Link} link One link object to render
 * @returns Link list item element
 */
function renderLinkItem(link) {
  const linkItem = divWithClasses(['is-size-7', 'link-item'])
  linkItem.dataset.id = link.id;

  // first line - link w/ page title
  const title = divWithClasses(['link-title', 'is-size-6']);
  const titleLink = document.createElement('a');
  titleLink.href = link.url;
  titleLink.target = '_blank';
  titleLink.rel = 'noopener noreferrer';
  titleLink.textContent = link.title;
  title.appendChild(titleLink);

  // second line - tags and description
  const tagsSpan = document.createElement('span');
  let hasTags = false;
  const searchInput = document.getElementById('search-input');
  if (link.tags.length && link.tags[0] !== '') {
    hasTags = true;
    link.tags.forEach((tag) => {
      const tagLink = document.createElement('a');
      tagLink.classList.add('has-text-info');
      const tagWithHash = `#${tag}`;
      tagLink.href = `/?search=${encodeURIComponent(tagWithHash)}`;
      tagLink.textContent = `#${tag} `;

      // Add the click event listener to the tagLink
      tagLink.addEventListener('click', (e) => {
        e.preventDefault();
        searchInput.value = tagWithHash;
        doSearch(true);
      });

      tagsSpan.appendChild(tagLink);
    });
  }

  const descrSpan = document.createElement('span');
  descrSpan.textContent = link.description ? link.description : '';

  const tagsAndDescription = divWithClasses(['has-text-grey-light', 'link-tags-description']);
  tagsAndDescription.appendChild(tagsSpan);
  if (hasTags && link.description) {
    tagsAndDescription.appendChild(document.createTextNode(' | '));
  }
  tagsAndDescription.appendChild(descrSpan);

  // third line - date, edit, and delete links
  const actionsAndDate = document.createElement('div');
  actionsAndDate.classList.add('has-text-grey');

  const date = document.createElement('span');
  const dateAgo = timeAgo(new Date(link.savedAt));
  date.textContent = `${dateAgo} | `;

  const actions = document.createElement('span');

  const editLink = document.createElement('a');
  editLink.classList.add('has-text-grey');
  editLink.textContent = 'Edit ';
  editLink.addEventListener('click', async () => {
    try {
      const linkData = await getLink(link.id);
      showEditForm(linkData);
    } catch (error) {
      console.error('Failed to load link for editing:', error);
    }
  });

  const removeLink = document.createElement('a');
  removeLink.classList.add('has-text-grey');
  removeLink.textContent = 'Remove';
  removeLink.addEventListener('click', () => {
    deleteLink(link.id).then(() => {
      loadLinks();
    });
  });

  actions.append(editLink, removeLink);
  actionsAndDate.append(date, actions);

  linkItem.append(title, tagsAndDescription, actionsAndDate);
  return linkItem;
}

async function handleLogoutButtonClick() {
  localStorage.removeItem('token');
  window.location.href = '/login.html';
}

async function handleAddLinkFormSubmit(event) {
  event.preventDefault();

  const title = document.getElementById('link-title').value;
  const url = document.getElementById('link-url').value;
  const description = document.getElementById('link-description').value;
  const tags = document
    .getElementById('link-tags')
    .value.split(',')
    .map((tag) => tag.trim());
  const visibility = document.getElementById('link-visibility').value;

  try {
    await addLink({ title, url, tags, visibility, description });
    document.getElementById('add-link-form').reset();
    closeModal('add-link-modal');
    loadLinks();
  } catch (error) {
    console.error('Error adding link:', error);
  }
}

async function addLink(linkData) {
  const response = await fetch(`${API_URL}/api/links`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
    body: JSON.stringify(linkData),
  });

  if (!response.ok) {
    throw new Error('Failed to add link');
  }
}

async function handleEditButtonClick(event) {
  const linkId = event.target.dataset.id;
  const link = await getLink(linkId);

  if (link) {
    showEditForm(link);
  } else {
    console.error('Error loading link data for editing');
  }
}

async function getLink(id) {
  const response = await fetch(`${API_URL}/api/links/${id}`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
  });

  if (response.ok) {
    return await response.json();
  } else {
    throw new Error('Failed to load link');
  }
}

async function handleDeleteButtonClick(event) {
  const linkId = event.target.dataset.id;
  try {
    await deleteLink(linkId);
    loadLinks();
  } catch (error) {
    console.error('Error deleting link:', error);
  }
}

function showEditForm(link) {
  const editForm = document.createElement('form');
  editForm.id = 'edit-link-form';
  editForm.innerHTML = `
    <input type="hidden" id="edit-link-id" value="${link.id}">
    <input type="text" class="custom-input" id="edit-link-title" value="${link.title}" required>
    <input type="url" class="custom-input" id="edit-link-url" value="${link.url}" required>
    <input type="text" class="custom-input" id="edit-link-tags" value="${(link.tags ?? []).join(
      ', '
    )}">
    <select class="custom-input" id="edit-link-visibility">
      <option value="private" ${link.visibility === 'private' ? 'selected' : ''}>Private</option>
      <option value="public" ${link.visibility === 'public' ? 'selected' : ''}>Public</option>
    </select>
    <button type="submit" class="custom-btn custom-btn-primary">Save Changes</button>
    <button type="button" class="custom-btn custom-btn-danger" id="cancel-edit">Cancel</button>
  `;

  const linkItem = document.querySelector(`[data-id="${link.id}"]`).closest('.link-item');
  linkItem.appendChild(editForm);

  editForm.addEventListener('submit', handleEditFormSubmit);
  document.getElementById('cancel-edit').addEventListener('click', () => {
    editForm.remove();
  });
}

function showAddForm() {
  const addLinkModal = document.getElementById('add-link-modal');
  addLinkModal.style.display = 'block';

  const addForm = document.getElementById('add-link-form');
  addForm.addEventListener('submit', handleAddLinkFormSubmit);
  document.getElementById('cancel-add').addEventListener('click', () => {
    addLinkModal.style.display = 'none';
  });
  document.getElementById('link-url').focus();
}

async function handleEditFormSubmit(event) {
  event.preventDefault();

  const linkId = document.getElementById('edit-link-id').value;
  const title = document.getElementById('edit-link-title').value;
  const url = document.getElementById('edit-link-url').value;
  const tags = document
    .getElementById('edit-link-tags')
    .value.split(',')
    .map((tag) => tag.trim());
  const visibility = document.getElementById('edit-link-visibility').value;

  try {
    await updateLink(linkId, {
      title,
      url,
      tags,
      visibility,
    });

    // Hide the edit form and reload the links
    closeEditForm();
    await loadLinks();
  } catch (error) {
    console.error('Error updating link:', error);
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

window.addEventListener('click', (event) => {
  // TODO: add edit form
  const addLinkModal = document.getElementById('add-link-modal');
  if (event.target === addLinkModal) {
    addLinkModal.style.display = 'none';
  }
});

function closeModal(id) {
  document.getElementById(id).style.display = 'none';
}

// websocket
wsHandler.on('scrapeFQDN', (data) => {
  const { title, description, url } = data;
  document.getElementById('link-title').value = title;
  document.getElementById('link-description').value = description;
  document.getElementById('link-url').value = url;
});

// Add event listener to the URL input field
const urlInput = document.getElementById('link-url');
urlInput.addEventListener('focusout', (event) => {
  const url = event.target.value;
  if (url) {
    wsHandler.send('scrapeFQDN', url);
  }
});
