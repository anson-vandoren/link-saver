import { DEFAULT_PER_PAGE } from './constants.js';

async function updateLink(id, data) {
  const response = await fetch(`/api/links/${id}`, {
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
  const response = await fetch(`/api/links/${id}`, {
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

async function getLink(id) {
  const response = await fetch(`/api/links/${id}`, {
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

async function getLinks(searchQuery = '', page = 1, pageSize = DEFAULT_PER_PAGE) {
  const headers = { 'Content-Type': 'application/json' };

  const token = localStorage.getItem('token');
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const { origin } = window.location;
  const apiPath = '/api/links';
  const url = new URL(`${origin}${apiPath}`);
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

async function getTags() {
  const response = await fetch('/api/tags', {
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

async function createLink(linkData) {
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

export {
  createLink,
  deleteLink,
  getLink,
  getLinks,
  getTags,
  updateLink,
};
