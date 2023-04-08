document.addEventListener('DOMContentLoaded', () => {
  init();
});

const API_URL = 'http://localhost:3001';

async function init() {
  if (localStorage.getItem('token')) {
    // Event listeners
    document.getElementById('add-link').addEventListener('click', () => {
      $('#add-link-modal').modal('show');
    });
    document.getElementById('search-button').addEventListener('click', () => {
      const searchQuery = document.getElementById('search-input').value;
      loadLinks(searchQuery);
    });
    document.getElementById('logout-btn').addEventListener('click', handleLogoutButtonClick);
    document.getElementById('add-link-form').addEventListener('submit', handleAddLinkFormSubmit);
    document.getElementById('theme-toggle').addEventListener('click', () => {
      const body = document.body;
      if (body.classList.contains('light-theme')) {
        body.classList.remove('light-theme');
        body.classList.add('dark-theme');
      } else {
        body.classList.remove('dark-theme');
        body.classList.add('light-theme');
      }
    });

    loadLinks();
  } else {
    window.location.href = '/login.html';
  }
}

function toggleTheme() {
  document.body.classList.toggle('dark');
}

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

async function loadLinks(searchQuery = '') {
  try {
    const links = await getLinks(searchQuery);
    const linkList = document.getElementById('link-list');
    linkList.innerHTML = '';

    links.forEach((link) => {
      const linkItem = document.createElement('li');
      linkItem.classList.add('list-group-item', 'link-item');
      linkItem.dataset.id = link.id;

      const title = document.createElement('span');
      title.classList.add('link-title');
      title.textContent = link.title;

      const editButton = document.createElement('button');
      editButton.classList.add('btn', 'btn-sm', 'btn-primary', 'ml-2');
      editButton.textContent = 'Edit';
      editButton.addEventListener('click', async () => {
        try {
          const linkData = await getLink(link.id);
          showEditForm(linkData);
        } catch (error) {
          console.error('Failed to load link for editing:', error);
        }
      });

      const deleteButton = document.createElement('button');
      deleteButton.classList.add('btn', 'btn-sm', 'btn-danger', 'ml-2');
      deleteButton.textContent = 'Delete';
      deleteButton.addEventListener('click', () => {
        deleteLink(link.id).then(() => {
          loadLinks();
        });
      });

      linkItem.append(title, editButton, deleteButton);
      linkList.appendChild(linkItem);
    });
  } catch (error) {
    console.error('Failed to load links:', error);
  }
}

async function handleLogoutButtonClick() {
  localStorage.removeItem('token');
  window.location.href = '/login.html';
}

async function handleAddLinkFormSubmit(event) {
  event.preventDefault();

  const title = document.getElementById('link-title').value;
  const url = document.getElementById('link-url').value;
  const tags = document
    .getElementById('link-tags')
    .value.split(',')
    .map((tag) => tag.trim());
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
    <input type="text" class="form-control" id="edit-link-title" value="${link.title}" required>
    <input type="url" class="form-control" id="edit-link-url" value="${link.url}" required>
    <input type="text" class="form-control" id="edit-link-tags" value="${(link.tags ?? []).join(
      ', '
    )}">
    <select class="form-control" id="edit-link-visibility">
      <option value="private" ${link.visibility === 'private' ? 'selected' : ''}>Private</option>
      <option value="public" ${link.visibility === 'public' ? 'selected' : ''}>Public</option>
    </select>
    <button type="submit" class="btn btn-primary">Save Changes</button>
    <button type="button" class="btn btn-secondary" id="cancel-edit">Cancel</button>
  `;

  const linkItem = document.querySelector(`[data-id="${link.id}"]`).closest('.link-item');
  linkItem.appendChild(editForm);

  editForm.addEventListener('submit', handleEditFormSubmit);
  document.getElementById('cancel-edit').addEventListener('click', () => {
    editForm.remove();
  });
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
