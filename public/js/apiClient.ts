import superjson from 'superjson';
import { DEFAULT_PER_PAGE } from './constants';
import { getToken, hasToken } from './utils';
import { createTRPCProxyClient, httpBatchLink, loggerLink } from '@trpc/client';
import type { AppRouter } from '../../src/routers/';
import type { CreateLinkReq, LinkRes, MultiLink, ScrapedURLRes, UpdateLinkReq, UserCredRes } from '../../src/schemas';

const trpc = createTRPCProxyClient<AppRouter>({
  transformer: superjson,
  links: [
    loggerLink({
      enabled: (opts) =>
        (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') ||
        (opts.direction === 'down' && opts.result instanceof Error),
    }),
    httpBatchLink({
      url: 'http://localhost:3001',
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

async function updateLink(data: UpdateLinkReq) {
  const result = await trpc.link.update.mutate(data);
  if (!result.success) {
    // TODO: proper typed error handling
    throw new Error('Failed to update link');
  }
  return result.link;
}

async function deleteLink(id: number): Promise<void> {
  const { success } = await trpc.link.delete.mutate(id);
  if (!success) {
    // TODO: proper typed error handling
    throw new Error('Failed to delete link');
  }
}

async function createLink(linkData: CreateLinkReq): Promise<void> {
  const { success } = await trpc.link.create.mutate(linkData);
  if (!success) {
    throw new Error('Failed to create link');
  }
}

async function getLink(id: number): Promise<LinkRes> {
  const result = await trpc.link.getOne.query(id);

  if (!result.success || !result.link) {
    throw new Error('Failed to load link');
  }
  return result.link;
}

async function getLinks(query = '', page = 1, limit = DEFAULT_PER_PAGE): Promise<MultiLink> {
  const result = await trpc.link.getMany.query({
    query,
    page,
    limit,
  });

  if (!result.success) {
    throw new Error(result.reason);
  }

  return {
    links: result.links,
    totalPages: result.totalPages,
    currentPage: result.currentPage,
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

  if (!result.success) {
    throw new Error(result.reason);
  }

  return result;
}

export { createLink, deleteLink, getLink, getLinks, getTags, updateLink };
