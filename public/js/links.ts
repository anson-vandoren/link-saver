import { createLink, deleteLink, getLink, getLinks, populateFromFQDN, updateLink } from './apiClient';
import { DEFAULT_PER_PAGE } from './constants';
import { showNotification } from './notification';
import { updatePagination } from './pagination';
import { updateSearch } from './search';
import { createTagLink } from './tags';
import { loadTags } from './tagsBar';
import {
  getElementById,
  getValuesOrThrow,
  isFormElem,
  isInputElem,
  querySelectorInFragment,
  scrollToTop,
  setValuesOrThrow,
  timeAgo,
} from './utils';
import type { ApiLink } from '../../src/schemas';

export const tagOnClick = () => {
  updateSearch(true);
  loadLinks()
    .then(() => {
      scrollToTop();
    })
    .catch((error: unknown) => {
      const reason = error instanceof Error ? error.message : 'Unknown error';
      showNotification(reason, 'danger');
    });
};

async function handleEditFormSubmit(event: Event) {
  event.preventDefault();

  if (!(event.target instanceof HTMLFormElement)) {
    throw new Error('Could not find edit form');
  }
  const linkId = event.target.dataset.id;
  if (!linkId) {
    throw new Error('Could not find link id');
  }
  const [title, url, rawTags, visibility] = getValuesOrThrow([
    'edit-link-title',
    'edit-link-url',
    'edit-link-tags',
    'edit-link-visibility',
  ]);
  const description = getElementById('edit-link-description', HTMLTextAreaElement).value;
  const tags = rawTags.split(',').map((tag) => tag.trim());

  const isPublic = visibility === 'public';

  try {
    await updateLink({
      id: +linkId,
      title,
      url,
      description,
      tags,
      isPublic,
    });

    // Hide the edit form and reload the links
    closeEditForm();
    await loadLinks();
    await loadTags(tagOnClick);
  } catch (error) {
    showNotification('Failed to update link', 'danger');
  }
}

function closeEditForm() {
  getElementById('edit-link-form', HTMLFormElement).remove();
}

async function handleAddLinkFormSubmit(event: Event) {
  event.preventDefault();
  const [title, url, rawTags, visibility] = getValuesOrThrow([
    'add-link-title',
    'add-link-url',
    'add-link-tags',
    'link-visibility',
  ]);
  const description = getElementById('add-link-description', HTMLTextAreaElement).value;

  const tags = rawTags.length ? rawTags.split(',').map((tag) => tag.trim()) : [];
  const isPublic = visibility === 'public';

  await createLink({
    title,
    url,
    tags,
    isPublic,
    description,
  });
  getElementById('add-link-form', HTMLFormElement).reset();
  return loadLinks();
}

// Add event listener to the URL input field
document.getElementById('add-link-url')?.addEventListener('focusout', (event) => {
  if (!isInputElem(event.target)) {
    return;
  }
  const url = event.target.value;
  if (!url) {
    return;
  }
  const result = populateFromFQDN(url);
  result.then((data) => {
    const titleElem = getElementById('add-link-title', HTMLInputElement);
    const descriptionElem = getElementById('add-link-description', HTMLTextAreaElement);
    const urlElem = getElementById('add-link-url', HTMLInputElement);
    titleElem.value ||= data.title;
    descriptionElem.value ||= data.description;
    urlElem.value = data.url; // override since backend adds http(s)://
  }).catch((error) => {
    console.error(error);
  });
  
});

function showEditForm(link: ApiLink) {
  const editLinkTemplate = getElementById('edit-link-template', HTMLTemplateElement);
  const editFrag = editLinkTemplate.content.cloneNode(true) as typeof editLinkTemplate.content;

  const editLinkForm = editFrag.querySelector('#edit-link-form');
  if (!isFormElem(editLinkForm)) {
    throw new Error('Could not find edit link form');
  }
  editLinkForm.dataset.id = `${link.id}`;

  setValuesOrThrow([
    { querySel: '#edit-link-title', value: link.title ?? '' },
    { querySel: '#edit-link-url', value: link.url ?? '' },
    { querySel: '#edit-link-tags', value: (link.tags ?? []).join(', ') },
  ], editFrag);

  const linkVisibility = link.isPublic ? 'public' : 'private';
  const visibilityElem = editFrag.querySelector(`#edit-link-visibility option[value="${linkVisibility}"]`);
  if (!(visibilityElem instanceof HTMLOptionElement)) {
    throw new Error('Could not find visibility element');
  }
  visibilityElem.selected = true;

  const linkItem = document.querySelector(`[data-id="${link.id}"]`)?.closest('.link-item');
  if (!linkItem) {
    throw new Error('Could not find link item');
  }
  linkItem.appendChild(editFrag);

  editLinkForm.addEventListener('submit', (event) => {
    handleEditFormSubmit(event).catch((_err) => {
      showNotification('Failed to update link', 'danger');
    });
  });

  getElementById('cancel-edit', HTMLButtonElement).addEventListener('click', () => {
    editLinkForm.remove();
  });
}

function renderLinkItem(link: ApiLink) {
  const linkItemTemplate = getElementById('link-item-template', HTMLTemplateElement);
  const fragment = linkItemTemplate.content.cloneNode(true) as typeof linkItemTemplate.content;
  const linkItem = querySelectorInFragment(fragment, '.link-item', HTMLElement);
  function fromLinkItem<T extends HTMLElement>(sel: string, type: new () => T): T {
    return querySelectorInFragment<T>(linkItem, sel, type);
  }
  linkItem.dataset.id = `${link.id}`;

  const titleLink = fromLinkItem('.link-item-title > a', HTMLAnchorElement);
  titleLink.href = link.url ?? '';
  titleLink.textContent = link.title ?? '';

  const tagsSpan = fromLinkItem('.link-item-tags-description > span:first-child', HTMLSpanElement);
  if (link.tags?.length && link.tags[0] !== '') {
    link.tags.forEach((tag) => {
      tagsSpan.appendChild(
        createTagLink(tag, {
          onClick: tagOnClick,
        }),
      );
    });
  }

  const descrSpan = fromLinkItem('.link-item-tags-description > span:last-child', HTMLSpanElement);
  descrSpan.textContent = link.description ?? '';

  if (link.tags?.length && link.tags[0] !== '' && link.description) {
    tagsSpan.insertAdjacentText('beforeend', ' | ');
  }

  const savedAt = link.savedAt ? new Date(link.savedAt) : new Date();
  const dateAgo = timeAgo(savedAt);

  // TODO: remove window location check when combined
  const isLoggedIn = !!link.userId && localStorage.getItem('token') && window.location.pathname === '/bookmarks.html';
  const dateSpan = fromLinkItem('.link-item-date-actions > span:first-child', HTMLSpanElement);
  if (isLoggedIn) {
    dateSpan.textContent = `Saved ${dateAgo} | `;
    const editLink = fromLinkItem('.link-item-date-actions > span:last-child > a:first-child', HTMLAnchorElement);
    const clickEditHandler = async (e: Event) => {
      e.preventDefault();
      if (!link.id) {
        throw new Error('Link ID not found');
      }
      const linkData = await getLink(link.id);
      showEditForm(linkData);
    };
    editLink.addEventListener('click', (e) => {
      clickEditHandler(e).catch((_err) => {
        console.debug('Failed to show edit form', _err);
        showNotification('Failed to show edit form', 'danger');
      });
    });

    const removeLink = fromLinkItem('.link-item-date-actions > span:last-child > a:last-child', HTMLAnchorElement);
    const cancelLink = document.createElement('a');
    const confirmLink = document.createElement('a');

    // Hide the remove link and show the cancel and confirm links
    const showConfirmation = () => {
      removeLink.style.display = 'none';
      cancelLink.style.display = 'inline';
      confirmLink.style.display = 'inline';
    };

    // Show the remove link and hide the cancel and confirm links
    const hideConfirmation = (e: Event) => {
      e.preventDefault();
      removeLink.style.display = 'inline';
      cancelLink.style.display = 'none';
      confirmLink.style.display = 'none';
    };

    const removeSpan = fromLinkItem('.link-item-date-actions > span:last-child', HTMLSpanElement);
    removeLink.addEventListener('click', showConfirmation);

    // Add the cancel and confirm links
    cancelLink.textContent = 'Cancel';
    cancelLink.classList.add('has-text-danger');
    cancelLink.style.display = 'none';
    removeSpan.appendChild(cancelLink);

    confirmLink.textContent = ' Confirm';
    confirmLink.classList.add('has-text-danger');
    confirmLink.style.display = 'none';
    removeSpan.appendChild(confirmLink);

    // Bind event listeners
    cancelLink.addEventListener('click', hideConfirmation);
    confirmLink.addEventListener('click', (e) => {
      e.preventDefault();
      if (!link.id) {
        throw new Error('Link ID not found');
      }
      deleteLink(link.id)
        .then(() => loadLinks())
        .catch((_err) => {
          showNotification('Failed to delete link', 'danger');
        });
    });
  } else {
    dateSpan.textContent = `Saved ${dateAgo} by ${link.username || 'anonymous'}`;
    const editRemoveSpan = fromLinkItem('.link-item-date-actions > span:last-child', HTMLSpanElement);
    editRemoveSpan.remove();
  }

  return fragment;
}

async function loadLinks(page = 1, pageSize = DEFAULT_PER_PAGE) {
  const searchInput = getElementById('search-input', HTMLInputElement);
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

    updatePagination(page, totalPages, loadLinks);
  } catch (err) {
    console.error('Failed to load links', err);
    showNotification('Oops, something went wrong.', 'danger');
  }
}

export { handleAddLinkFormSubmit, loadLinks };
