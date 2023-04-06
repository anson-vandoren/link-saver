document.addEventListener('DOMContentLoaded', () => {
  init();
});

const API_URL = 'http://localhost:3001';

async function init() {
  if (localStorage.getItem('token')) {
    document.getElementById('logout-btn').addEventListener('click', handleLogoutButtonClick);
    document.getElementById('add-link-form').addEventListener('submit', handleAddLinkFormSubmit);

    loadLinks();
  } else {
    window.location.href = '/login.html';
  }
}

async function getLinks() {
  const response = await fetch(`${API_URL}/api/links`, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  });

  if (response.ok) {
    return await response.json();
  } else {
    throw new Error('Failed to load links');
  }
}

async function loadLinks() {
  const links = await getLinks();

  // Get the Handlebars template and compile it
  const templateSource = document.getElementById('links-list').innerHTML;
  const template = Handlebars.compile(templateSource);

  // Expand the template with the links data
  const linksElement = document.getElementById('link-list');
  linksElement.innerHTML = template(links);
  console.log(links)

  // Add event listeners for edit and delete buttons
  const editButtons = document.querySelectorAll('.edit-link');
  const deleteButtons = document.querySelectorAll('.delete-link');

  editButtons.forEach((button) => {
    button.addEventListener('click', handleEditButtonClick);
  });

  deleteButtons.forEach((button) => {
    button.addEventListener('click', handleDeleteButtonClick);
  });
}

async function handleLogoutButtonClick() {
  localStorage.removeItem('token');
  window.location.href = '/login.html';
}

async function handleAddLinkFormSubmit(event) {
  event.preventDefault();

  const title = document.getElementById('link-title').value;
  const url = document.getElementById('link-url').value;
  const tags = document.getElementById('link-tags').value.split(',').map(tag => tag.trim());
  const visibility = document.getElementById('link-visibility').value;

  try {
    await addLink({ title, url, tags, visibility });
    document.getElementById('add-link-form').reset();
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
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify(linkData)
  });

  if (!response.ok) {
    throw new Error('Failed to add link');
  }
}

async function handleEditButtonClick(event) {
  const linkId = event.target.dataset.id;
  // Load the link and show the edit form
  // TODO: Implement the edit functionality
  console.log('Edit link with id:', linkId);
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
