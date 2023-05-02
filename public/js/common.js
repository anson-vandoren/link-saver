import showNotification from './notification.js';
import { scrollToTop, timeAgo } from './utils.js';
import { deleteLink, getLink, getLinks, getTags, updateLink } from './apiClient.js';
import { DEFAULT_PER_PAGE } from './constants.js';

/**
 * Fetch links from the API and render them in the DOM
 * @param {string} searchQuery optional search query to filter links
 * @throws {Error} if the request fails
 */
export async function loadLinks(page = 1, pageSize = DEFAULT_PER_PAGE) {
  const searchInput = document.getElementById('search-input');
  const searchQuery = searchInput?.value.trim() ?? '';

  const linkList = document.getElementById('link-list');
  if (!linkList) return; // nowhere to render to

  try {
    const { links, totalPages } = await getLinks(searchQuery, page, pageSize);
    linkList.innerHTML = '';

    links.forEach((link) => {
      const item = renderLinkItem(link);
      linkList.appendChild(item);
    });

    updatePagination(searchQuery, page, totalPages);
  } catch (err) {
    showNotification('Oops, something went wrong.', 'danger');
  }
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
    const cancelLink = document.createElement('a');
    const confirmLink = document.createElement('a');

    // Hide the remove link and show the cancel and confirm links
    const showConfirmation = () => {
      removeLink.style.display = 'none';
      cancelLink.style.display = 'inline';
      confirmLink.style.display = 'inline';
    };

    // Show the remove link and hide the cancel and confirm links
    const hideConfirmation = () => {
      removeLink.style.display = 'inline';
      cancelLink.style.display = 'none';
      confirmLink.style.display = 'none';
    };

    const removeSpan = linkItem.querySelector('.link-item-date-actions > span:last-child');
    removeLink.addEventListener('click', showConfirmation);

    // Add the cancel and confirm links
    cancelLink.href = 'javascript:void(0)';
    cancelLink.textContent = 'Cancel';
    cancelLink.classList.add('has-text-danger');
    cancelLink.style.display = 'none';
    removeSpan.appendChild(cancelLink);

    confirmLink.href = 'javascript:void(0)';
    confirmLink.textContent = ' Confirm';
    confirmLink.classList.add('has-text-danger');
    confirmLink.style.display = 'none';
    removeSpan.appendChild(confirmLink);

    // Bind event listeners
    cancelLink.addEventListener('click', hideConfirmation);
    confirmLink.addEventListener('click', () => {
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

function createTagLink(tag, shouldShowHash = true, isFirst = false) {
  const tagLink = document.createElement('a');
  tagLink.classList.add('has-text-info');
  const tagWithHash = `#${tag}`;
  // tagLink.href = `/?search=${encodeURIComponent(tagWithHash)}`;
  tagLink.textContent = `${shouldShowHash ? '#' : ''}${tag} `;
  // if it's the first tag, <strong> the first character and make the first character uppercase
  if (isFirst) {
    tagLink.innerHTML = `<strong>${tagLink.textContent[0].toUpperCase()}</strong>${tagLink.textContent.slice(1)}`;
  }

  const searchInput = document.getElementById('search-input');
  tagLink.addEventListener('click', (e) => {
    e.preventDefault();
    searchInput.value = tagWithHash;
    doSearch(true);
    scrollToTop();
  });

  return tagLink;
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
    await loadTags();
  } catch (error) {
    showNotification('Failed to update link', 'danger');
  }
}
function closeEditForm() {
  const editForm = document.getElementById('edit-link-form');
  if (editForm) {
    editForm.remove();
  }
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
    await loadLinks();
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
      loadLinks(pageNumber);
    });
  }
  listItem.appendChild(paginationLink);
  return listItem;
}

/* Expected pagination layout:
 * 1 2 3 4 5 ... 10
 * 1 ... 4 5 6 ... 10
 * 1 ... 6 7 8 9 10
 */
function updatePagination(searchQuery, currentPage, totalPages) {
  const paginationList = document.querySelector('.pagination-list');
  paginationList.innerHTML = '';

  const maxPagesToShow = 5; // Adjust this value to show more or fewer page buttons

  let startPage = Math.max(2, currentPage - Math.floor((maxPagesToShow - 2) / 2));
  let endPage = Math.min(totalPages - 1, startPage + maxPagesToShow - 3);
  startPage = Math.max(2, endPage - (maxPagesToShow - 3));

  // Add the first page button
  paginationList.appendChild(createPaginationItem(1, currentPage));

  // Add left ellipsis if necessary
  if (startPage > 2) {
    paginationList.appendChild(createEllipsis());
  } else {
    // if not an ellipsis, add the second page button
    paginationList.appendChild(createPaginationItem(2, currentPage));
    startPage++;
    endPage++;
  }

  // if we won't be adding an ellipsis at the end, make startPage one sooner
  if (endPage === totalPages - 1) {
    startPage--;
  }

  // Add the page buttons
  for (let i = startPage; i <= endPage; i++) {
    const listItem = createPaginationItem(i, currentPage);
    paginationList.appendChild(listItem);
  }

  // Add right ellipsis if necessary
  if (endPage < totalPages - 1) {
    paginationList.appendChild(createEllipsis());
  }

  // Add the last page button
  if (totalPages > 1) {
    paginationList.appendChild(createPaginationItem(totalPages, currentPage));
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
      loadLinks(currentPage - 1);
    });
  }

  if (currentPage >= totalPages) {
    nextBtnClone.setAttribute('disabled', '');
  } else {
    nextBtnClone.removeAttribute('disabled');
    nextBtnClone.addEventListener('click', () => {
      loadLinks(currentPage + 1);
    });
  }
}

function generateTagsHtml(tags) {
  const groupedTags = tags.reduce((acc, tag) => {
    const firstChar = tag.charAt(0).toUpperCase();
    if (!acc[firstChar]) {
      acc[firstChar] = [];
    }
    acc[firstChar].push(tag);
    return acc;
  }, {});

  const tagsFragment = document.createDocumentFragment();

  // eslint-disable-next-line no-restricted-syntax, guard-for-in
  for (const char in groupedTags) {
    const block = document.createElement('div');
    block.classList.add('block');

    groupedTags[char].forEach((tag, index) => {
      const isFirst = index === 0;
      const tagLink = createTagLink(tag.toLowerCase(), false, isFirst);
      tagLink.classList.add('tag-link'); // Add the class for styling
      if (index > 0) {
        tagLink.style.marginRight = '8px'; // Add space between tags
      }
      block.appendChild(tagLink); // Add the tag link to the block
    });

    tagsFragment.appendChild(block);
  }

  return tagsFragment;
}

export async function loadTags() {
  // Replace this with the actual API call to fetch the tags
  const tags = await getTags();

  const tagsList = document.getElementById('tagsList');
  const tagsContainer = generateTagsHtml(tags);
  tagsList.innerHTML = '';
  tagsList.appendChild(tagsContainer);
}
