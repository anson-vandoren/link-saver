import { z } from 'zod';
import axios from 'axios';
import { JSDOM } from 'jsdom';
import logger from '../logger';
import type {
  ApiLink,
  ApiLinks,
  DbLinkWithTags,
  DbNewLink,
  ScrapedURLRes,
  WrappedApiLink,
  WrappedApiLinks,
} from '../schemas/link';
import {
  LinkDbToApiWithTagsSchema,
  NewLinkApiToDbSchema,
} from '../schemas/link';
import { OpMeta, OpMetaSchema } from '../schemas/util';
import wsHandler from '../websocket';
import { DEFAULT_PER_PAGE } from '../../public/js/constants';
import type { DbContext } from '../db';

export function deleteLink(db: DbContext, linkId: number, userId: number): boolean {
  const link = db.Link.getOne(linkId);
  if (!link) {
    logger.warn('Cannot delete link - not found', { linkId, userId });
    return false;
  }
  if (link.userId !== userId) {
    logger.warn('Cannot delete link - not owned by user', { linkId, userId });
    return false;
  }

  db.LinkTag.deleteByLinkId(linkId);
  db.Link.delete(linkId);

  logger.debug('Deleted link', { linkId, userId });
  return true;
}

export function updateLink(db: DbContext, userId: number, data: ApiLink): WrappedApiLink {
  const { id: linkId } = data;
  const linkUpdates = data;
  linkUpdates.userId = userId;
  if (!linkId) {
    logger.warn('Cannot update link - no id', { linkId, userId });
    return {
      success: false,
      error: 'No link id',
    };
  }
  const link = db.Link.getOne(linkId);
  if (!link) {
    logger.warn('Cannot update link - not found', { linkId, userId });
    return {
      success: false,
      error: 'Link not found',
    };
  }
  if (link.userId !== userId) {
    logger.warn('Cannot update link - not owned by user', { linkId, userId });
    return {
      success: false,
      error: 'User does not own link',
    };
  }

  const asDbLink = NewLinkApiToDbSchema.parse(linkUpdates);
  const dbLinkRes = db.Link.update(linkId, asDbLink); // ignores tags
  const newLink = LinkDbToApiWithTagsSchema.parse({
    ...dbLinkRes,
    tags: data.tags ?? [],
  });

  if (!newLink) {
    logger.warn('Failed to update link', { linkId, userId });
    return {
      success: false,
      error: 'Failed to update link',
    };
  }

  if (!data.tags) {
    logger.debug('Updated link - no tag changes', { linkId, userId });
    return {
      success: true,
      data: newLink,
    };
  }

  // delete old LinkTag associations
  db.LinkTag.deleteByLinkId(linkId);

  // get or create new tags
  const tagIdsForLink = db.Tag.getOrCreate(data.tags).map((tag) => tag.id);
  db.LinkTag.create(linkId, tagIdsForLink);

  logger.debug('Updated link - tag changes', { linkId, userId });

  return {
    success: true,
    data: newLink,
  };
}

export function createLink(db: DbContext, userId: number, data: ApiLink): WrappedApiLink {
  const linkData = data;
  if (!linkData.isPublic) {
    linkData.isPublic = false;
  }
  linkData.userId = userId;
  const dbLinkData = NewLinkApiToDbSchema.parse(linkData);
  const link = db.Link.create(dbLinkData);

  if (!link) {
    logger.warn('Failed to create link', { userId, data });
    return {
      success: false,
      error: 'Failed to create link',
    };
  }

  const tags = linkData.tags ?? [];
  if (tags.length) {
    const tagIdsForLink = db.Tag.getOrCreate(tags).map((tag) => tag.id);
    db.LinkTag.create(link.id, tagIdsForLink);
  }

  const parsed = LinkDbToApiWithTagsSchema.parse({
    ...link,
    tags,
  });

  logger.debug('Created link', { userId, data });
  return {
    success: true,
    data: parsed,
  };
}

export function getLink(db: DbContext, linkId: number, userId?: number): WrappedApiLink {
  const includeUserId = userId !== undefined;
  const link = db.Link.getOne(linkId, includeUserId);

  if (!link) {
    logger.warn('Failed to get link', { linkId, userId });
    return {
      success: false,
      error: 'Failed to get link',
    };
  }

  const tagIds = db.LinkTag.getByLinkId(linkId).map((linkTag) => linkTag.tagId);
  const tags = tagIds.length ? db.Tag.get(tagIds).map((tag) => tag.name) : [];

  const parsed = LinkDbToApiWithTagsSchema.parse({
    ...link,
    tags,
  });

  logger.debug('Got link', { linkId, userId });
  return {
    success: true,
    data: parsed,
  };
}

export function getLinks(db: DbContext, query = '', page = 1, limit = DEFAULT_PER_PAGE, userId?: number): WrappedApiLinks {
  let validatedLimit = limit;
  if (!userId) {
    validatedLimit = Math.min(limit, 100);
  }
  if (limit < 1) {
    validatedLimit = DEFAULT_PER_PAGE;
  }
  const offset = (page - 1) * validatedLimit;

  const searchTerms = query.split(' ').filter((term) => term.length > 0);

  const tagsFilter = searchTerms
    .filter((term) => term.startsWith('#'))
    .map((term) => term.slice(1))
    .filter((term) => term.length > 0);

  const titleDescriptionUrlFilter = searchTerms
    .filter((term) => !term.startsWith('#'))
    .filter((term) => term.length > 0);

  const filter = {
    tagTerms: tagsFilter,
    linkTerms: titleDescriptionUrlFilter,
  };
  const pagination = {
    offset,
    limit: validatedLimit,
  };
  const dbResults = db.Link.getMany(filter, pagination, userId) ?? [];
  const results = dbResults.map((link) => LinkDbToApiWithTagsSchema.parse(link));
  const totalLinks = db.Link.count(filter, userId);
  const totalPages = Math.ceil(totalLinks / validatedLimit);

  let sanitizedResults: ApiLink[] = [];
  const includeUserId = userId !== undefined;
  if (!includeUserId) {
    // add username instead
    const foundUserId = results[0]?.userId;
    const username = db.User.getById(foundUserId)?.username;
    results.forEach((link) => {
      sanitizedResults.push({
        ...link,
        userId: undefined,
        username,
      });
    });
  } else {
    sanitizedResults = results;
  }

  logger.debug('getLinks', {
    query,
    page,
    limit: validatedLimit,
    offset,
    totalLinks,
    totalPages,
    results: sanitizedResults?.length ?? 0,
  });
  const result: ApiLinks = {
    links: sanitizedResults ?? [],
    currentPage: page,
    totalPages,
  };
  return {
    success: true,
    data: result,
  };
}

function replaceUnusualWhitespace(text: string): string {
  // eslint-disable-next-line no-control-regex
  const unusualWhitespaceRegex = /[\u0085\u2028\u2029\u000C\u000B]/g;
  return text.replace(unusualWhitespaceRegex, ' ');
}

function exportBookmarks(links: DbLinkWithTags[]): string {
  const header = `<!DOCTYPE NETSCAPE-Bookmark-file-1>

<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">

<TITLE>Bookmarks</TITLE>

<H1>Bookmarks</H1>

<DL><p>
`;

  const footer = '\n</DL><p>';

  const bookmarks = links
    .map((link) => {
      const { title, url, description, tags, isPublic, savedAt } = link;

      const dt = Math.floor(savedAt);

      const tagsSection = tags && tags.length > 0 ? ` TAGS="${tags.join(',')}"` : '';
      const firstLine = `\t<DT><A HREF="${url}" ADD_DATE="${dt}" PRIVATE="${isPublic}" ${tagsSection}>${
        title ?? ''
      }</A>\n`;
      if (!description) {
        return firstLine;
      }
      return `${firstLine}\n\t<DD>${description}\n`;
    })
    .join('\n');

  const bookmarkHTML = header + bookmarks + footer;
  return replaceUnusualWhitespace(bookmarkHTML);
}

export function exportLinks(db: DbContext, userId: number): string {
  const links = db.Link.getMany(userId);
  logger.debug('exporting links', { userId, count: links.length });
  const bookmarks = exportBookmarks(links);
  return bookmarks;
}

function parseNetscapeHTML(htmlContent: string, userId: number): DbNewLink[] {
  const bookmarks: DbNewLink[] = [];
  const dom = new JSDOM(htmlContent);
  const dtElements = dom.window.document.querySelectorAll('DT');

  dtElements.forEach((dtElement) => {
    const aElement = dtElement.querySelector('A');
    if (aElement) {
      const url = aElement.getAttribute('href');
      if (!url) {
        return;
      }
      const title = aElement.textContent?.trim() ?? '';
      const tags = (aElement.getAttribute('tags') || '')
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);
      const addTimestamp = aElement.getAttribute('add_date');
      const savedAt = addTimestamp ? parseInt(addTimestamp, 10) * 1000 : Date.now();
      const isPrivate = aElement.getAttribute('private') === '1';
      const isPublic = isPrivate ? 0 : 1;

      const ddElement = dtElement.nextElementSibling;
      const description = (ddElement && ddElement.tagName === 'DD' ? ddElement.textContent?.trim() : '') ?? '';

      bookmarks.push({
        url,
        title,
        tags,
        description,
        savedAt,
        isPublic,
        userId,
      });
    }
  });

  return bookmarks;
}

function addBookmarksToDatabase(db: DbContext, bookmarks: DbNewLink[]): void {
  const { userId } = bookmarks[0]; // all bookmarks should have the same userId
  const sock = wsHandler.connectionFor(userId);
  if (!sock) {
    logger.warn('no websocket connection found for user', { userId });
  }

  const totalBookmarks = bookmarks.length;

  const insertedIds = db.Link.import(bookmarks);

  // add tags to each link
  for (let i = 0; i < bookmarks.length; i++) {
    const { tags } = bookmarks[i];

    if (tags && tags.length) {
      const linkId = insertedIds[i];
      const tagItems = db.Tag.getOrCreate(tags);
      const tagIds = tagItems.map((tag) => tag.id);
      db.LinkTag.create(linkId, tagIds);
    }

    // Send progress update after each link creation
    // TODO: consider moving to tRPC subscription
    if (i % 10 === 0) {
      sock?.send(
        JSON.stringify({
          type: 'import-progress',
          payload: { progress: (i / totalBookmarks) * 100 },
        }),
      );
    }
  }

  // Send final progress update
  sock?.send(JSON.stringify({ type: 'import-progress', payload: { progress: 100 } }));
}

export function importLinks(db: DbContext, htmlContent: string, userId: number): OpMeta {
  const bookmarks = parseNetscapeHTML(htmlContent, userId);
  addBookmarksToDatabase(db, bookmarks);
  return OpMetaSchema.parse({ success: true });
}

export async function scrapeFQDN(url: string): Promise<ScrapedURLRes> {
  if (!url) {
    throw new Error('The input URL is empty');
  }

  let actualUrl = url;
  if (!url.startsWith('http') && !url.startsWith('https')) {
    actualUrl = `http://${url}`;
  }
  const { data, finalUrl } = await fetchHTML(actualUrl);
  const dom = new JSDOM(data);
  const title = dom.window.document.querySelector('head > title')?.textContent?.trim() ?? '';
  const description = dom.window.document.querySelector('head > meta[name="description"]')?.getAttribute('content') ?? '';

  return {
    url: finalUrl,
    title,
    description,
  };
}

type FetchedHTML = {
  data: string;
  finalUrl: string;
};
const axiosResponseSchema = z.object({
  status: z.number(),
  data: z.string(),
  request: z.object({
    res: z.object({
      responseUrl: z.string(),
    }),
  }),
});
async function fetchHTML(url: string): Promise<FetchedHTML> {
  try {
    const rawRes = await axios.get(url, { maxRedirects: 5 });
    const response = axiosResponseSchema.parse(rawRes);

    if (response.status >= 200 && response.status < 300) {
      if (typeof response.data !== 'string') {
        throw new Error('Response data is not a string');
      }
      return {
        data: response.data,
        finalUrl: response.request.res.responseUrl,
      };
    }
    throw new Error(`HTTP error: ${response.status}`);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    throw new Error(`Failed to fetch URL: ${url}: ${message}`);
  }
}
