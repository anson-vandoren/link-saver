import superjson from 'superjson';
import { DEFAULT_PER_PAGE } from './constants';
import { getToken, hasToken } from './utils';
import { createTRPCProxyClient, httpBatchLink, loggerLink, TRPCClientError, TRPCLink } from '@trpc/client';
import type { AppRouter } from '../../src/routers/';
import type { ApiLink, ApiLinks, UserCredRes } from '../../src/schemas';
import type { ScrapedURLRes } from '../../src/schemas/link';
import { observable } from '@trpc/server/observable';

function isTRPCClientError(cause: unknown): cause is TRPCClientError<AppRouter> {
  return cause instanceof TRPCClientError;
}

const globalErrorHandlerLink: TRPCLink<AppRouter> = () => {
  return ({ next, op }) => {
    return observable((observer) => {
      console.debug('performing operation:', op);
      const unsubscribe = next(op).subscribe({
        next(value) {
          observer.next(value);
        },
        error(err) {
          console.log('error', err);
          if (isTRPCClientError(err)) {
            if (err.data?.code === 'UNAUTHORIZED') {
              if (typeof window !== 'undefined') {
                if (hasToken()) {
                  window.localStorage.removeItem('token');
                }
                if (window.location.pathname !== '/') {
                  window.location.href = '/';
                }
              }
            }
          }
          observer.error(err);
        },
        complete() {
          observer.complete();
        },
      });
      return unsubscribe;
    })
  }
}

const baseUrl = window.location.origin;
const apiUrl = `${baseUrl}/api/v2`;
const trpc = createTRPCProxyClient<AppRouter>({
  transformer: superjson,
  links: [
    loggerLink({
      enabled: (opts) =>
        (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') ||
        (opts.direction === 'down' && opts.result instanceof Error),
    }),
    globalErrorHandlerLink,
    httpBatchLink({
      url: apiUrl,
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

export async function updateLink(data: ApiLink) {
  const result = await trpc.link.update.mutate(data);
  if (!result) {
    // TODO: proper typed error handling
    throw new Error('Failed to update link');
  }
  return result;
}

export async function deleteLink(id: number): Promise<void> {
  const success = await trpc.link.delete.mutate(id);
  if (!success) {
    // TODO: proper typed error handling
    throw new Error('Failed to delete link');
  }
}

export async function createLink(linkData: ApiLink): Promise<void> {
  const link = await trpc.link.create.mutate(linkData);
  if (!link) {
    throw new Error('Failed to create link');
  }
}

export async function getLink(id: number): Promise<ApiLink> {
  const link = await trpc.link.getOne.query(id);

  if (!link) {
    throw new Error('Failed to load link');
  }
  return link;
}

export async function getLinks(query = '', page = 1, limit = DEFAULT_PER_PAGE): Promise<ApiLinks> {
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

export async function getTags(sortBy: 'name' | 'links' = 'name', query = ''): Promise<string[]> {
  const result = await trpc.tag.get.query({
    query,
    sortBy,
  });

  if (!result.success) {
    throw new Error(result.reason);
  }

  return result.tags;
}

export async function purgeUnusedTags(): Promise<number> {
  const result = await trpc.tag.purgeUnused.mutate();

  return result;
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

export async function importBookmarks(file: string): Promise<void> {
  const result = await trpc.link.import.mutate(file);
  if (!result) {
    throw new Error('Failed to import bookmarks');
  }
}