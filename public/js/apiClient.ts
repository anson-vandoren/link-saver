import superjson from 'superjson';
import { DEFAULT_PER_PAGE } from './constants';
import { getToken, hasToken } from './utils';
import { createTRPCProxyClient, httpBatchLink, loggerLink } from '@trpc/client';
import type { AppRouter } from '../../src/routers/';
import type { ApiLink, ApiLinks, UserCredRes } from '../../src/schemas';
import type { ScrapedURLRes } from '../../src/schemas/link';

const trpc = createTRPCProxyClient<AppRouter>({
  transformer: superjson,
  links: [
    loggerLink({
      enabled: (opts) =>
        (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') ||
        (opts.direction === 'down' && opts.result instanceof Error),
    }),
    httpBatchLink({
      url: 'http://localhost:3001/api/v2',
      headers() {
        if (!hasToken()) {
          return {};
        }
        return {
          Authorization: `Bearer ${getToken()}`,
        };
      },
    }),
  ],
});

async function updateLink(data: ApiLink) {
  const result = await trpc.link.update.mutate(data);
  if (!result) {
    // TODO: proper typed error handling
    throw new Error('Failed to update link');
  }
  return result;
}

async function deleteLink(id: number): Promise<void> {
  const success = await trpc.link.delete.mutate(id);
  if (!success) {
    // TODO: proper typed error handling
    throw new Error('Failed to delete link');
  }
}

async function createLink(linkData: ApiLink): Promise<void> {
  const link = await trpc.link.create.mutate(linkData);
  if (!link) {
    throw new Error('Failed to create link');
  }
}

async function getLink(id: number): Promise<ApiLink> {
  const link = await trpc.link.getOne.query(id);

  if (!link) {
    throw new Error('Failed to load link');
  }
  return link;
}

async function getLinks(query = '', page = 1, limit = DEFAULT_PER_PAGE): Promise<ApiLinks> {
  const links = await trpc.link.getMany.query({
    query,
    page,
    limit,
  });

  if (!links) {
    throw new Error('Failed to load links');
  }

  return {
    links: links.links,
    totalPages: links.totalPages,
    currentPage: links.currentPage,
  };
}

async function getTags(sortBy: 'name' | 'links' = 'name', query = ''): Promise<string[]> {
  const result = await trpc.tag.get.query({
    query,
    sortBy,
  });

  if (!result.success) {
    throw new Error(result.reason);
  }

  return result.tags;
}

export async function doLogin(username: string, password: string): Promise<string> {
  const result = await trpc.user.login.query({
    username,
    password,
  });

  // TODO: figure out error handling
  return result.token;
}

export async function doSignup(username: string, password: string): Promise<UserCredRes> {
  return await trpc.user.register.mutate({
    username,
    password,
  });
}

export async function populateFromFQDN(url: string, title?: string, description?: string): Promise<ScrapedURLRes> {
  const result = await trpc.link.populateFromFQDN.query(url);

  if (!result) {
    throw new Error('Failed to populate link');
  }

  return result;
}

export { createLink, deleteLink, getLink, getLinks, getTags, updateLink };
