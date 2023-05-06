import { GetLinksResponse, Link, LoginUserResponse, Tag } from '../../shared/apiTypes';
import { DEFAULT_PER_PAGE } from './constants';
import { getToken, hasToken } from './utils';

async function updateLink(id: number, data: Partial<Link>) {
  const response = await fetch(`/api/links/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('Failed to update link');
  }
}

async function deleteLink(id: number) {
  const response = await fetch(`/api/links/${id}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to delete link');
  }
}

async function getLink(id: number): Promise<Link> {
  const response = await fetch(`/api/links/${id}`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
    },
  });

  if (response.redirected) {
    window.location.href = response.url;
    return {} as Link;
  }

  if (response.ok) {
    return response.json() as Promise<Link>;
  }
  throw new Error('Failed to load link');
}

type GetLinksRes = {
  links: Link[];
  totalPages: number;
}
async function getLinks(searchQuery = '', page = 1, pageSize = DEFAULT_PER_PAGE): Promise<GetLinksRes> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  const token = localStorage.getItem('token');
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const { origin } = window.location;
  const apiPath = '/api/links';
  const url = new URL(`${origin}${apiPath}`);
  url.searchParams.append('search', searchQuery);
  url.searchParams.append('page', `${page}`);
  url.searchParams.append('pageSize', `${pageSize}`);

  const response = await fetch(url.toString(), { headers });

  if (response.redirected) {
    window.location.href = response.url;
    return {} as GetLinksRes;
  }

  if (response.ok) {
    const res = await response.json() as GetLinksResponse;

    return {
      links: res.links,
      totalPages: res.totalPages,
    };
  }
  throw new Error('Failed to load links');
}

async function getTags(): Promise<Tag[]> {
  const authHeader = hasToken() ? { Authorization: `Bearer ${getToken()}` } : {};
  const headers = { 'Content-Type': 'application/json' } as Record<string, string>;
  if (authHeader.Authorization) {
    headers.Authorization = authHeader.Authorization;
  }
  const response = await fetch('/api/tags', {
    headers,
  });

  if (response.ok) {
    return response.json() as Promise<Tag[]>;
  }
  throw new Error('Failed to load link');
}

async function createLink(linkData: Partial<Link>) {
  const response = await fetch('/api/links', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify(linkData),
  });

  if (!response.ok) {
    throw new Error('Failed to add link');
  }
}

export async function doLogin(username: string, password: string): Promise<LoginUserResponse> {
  const response = await fetch('/api/users/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  if (response.ok) {
    const { token } = await response.json() as LoginUserResponse;
    return { token };
  }
  return {};
}

export {
  createLink,
  deleteLink,
  getLink,
  getLinks,
  getTags,
  updateLink,
};
