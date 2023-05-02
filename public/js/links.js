import { loadLinks } from './common.js';
import wsHandler from './ws.js';

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
  const response = await fetch('/api/links', {
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

export default handleAddLinkFormSubmit;
