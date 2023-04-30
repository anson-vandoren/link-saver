import { API_URL, handleLogoutButtonClick, loadLinks, loadTags, doSearch } from './common.js';
import { wsHandler } from './ws.js';

function goToRoot() {
  window.location.href = '/';
}

function initModals() {
  function openModal($el) {
    $el.classList.add('is-active');

    // set focus correctly on the Add Link modal
    if ($el.id === 'add-link-modal') {
      document.getElementById('add-link-url').focus();
    }
  }

  function closeModal($el) {
    $el.classList.remove('is-active');

    if ($el.id === 'add-link-modal') {
      document.getElementById('add-link-form').reset();
    }
  }

  function closeAllModals() {
    (document.querySelectorAll('.modal') || []).forEach(($modal) => {
      closeModal($modal);
    });
  }

  // Add a click event on buttons to open a specific modal
  (document.querySelectorAll('.js-modal-trigger') || []).forEach(($trigger) => {
    const modal = $trigger.dataset.target;
    const $target = document.getElementById(modal);

    $trigger.addEventListener('click', () => {
      openModal($target);
    });
  });

  // Add a click event on various child elements to close the parent modal
  (
    document.querySelectorAll(
      '.modal-background, .modal-close, .modal-card-head .delete, .modal-card-foot .button'
    ) || []
  ).forEach(($close) => {
    const $target = $close.closest('.modal');

    $close.addEventListener('click', () => {
      closeModal($target);
    });
  });

  // Add a keyboard event to close all modals
  document.addEventListener('keydown', (event) => {
    const e = event || window.event;

    if (e.key === 'Escape') {
      closeAllModals();
    }
  });
}

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
    goToRoot();
  }
}

function setInitialSearch() {
  const searchQuery = new URLSearchParams(window.location.search).get('search') || '';
  document.getElementById('search-input').value = searchQuery;

  if (searchQuery) {
    doSearch();
  }
}

async function handleAddLinkFormSubmit(event) {
  event.preventDefault();

  const title = document.getElementById('add-link-title').value;
  const url = document.getElementById('add-link-url').value;
  const description = document.getElementById('add-link-description').value;
  const tags = document
    .getElementById('add-link-tags')
    .value.split(',')
    .map((tag) => tag.trim());
  const visibility = document.getElementById('link-visibility').value;
  const isPublic = visibility === 'public';

  await addLink({
    title,
    url,
    tags,
    isPublic,
    description,
  });
  document.getElementById('add-link-form').reset();
  loadLinks();
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

// websocket
wsHandler.on('scrapeFQDN', (data) => {
  const { title, description, url } = data;
  document.getElementById('add-link-title').value = title;
  document.getElementById('add-link-description').value = description;
  document.getElementById('add-link-url').value = url;
});

// Add event listener to the URL input field
const urlInput = document.getElementById('add-link-url');
urlInput.addEventListener('focusout', (event) => {
  const url = event.target.value;
  if (url) {
    wsHandler.send('scrapeFQDN', url);
  }
});

document.addEventListener('DOMContentLoaded', () => {
  init();
  setInitialSearch();
  loadTags();
});
