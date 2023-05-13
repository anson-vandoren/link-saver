import { z } from 'zod';
import { JSDOM } from 'jsdom';
import logger from '../logger';
import {
  CreateLinkReq,
  LinkImport,
  LinkRes,
  LinkResSchema,
  UpdateLinkReq,
  dbCreateLink,
  dbDeleteLink,
  dbFindLinks,
  dbFindLinksCount,
  dbGetAllLinks,
  dbGetLink,
  dbImportLinks,
  dbUpdateLink,
} from '../models/link';
import { createLinkTags, deleteLinkTagByLinkId, getLinkTagsByLinkId } from '../models/linkTag';
import { getOrCreateTagsByName, getTagsById } from '../models/tag';
import wsHandler from '../websocket';

export const LinkOpResSchema = z.object({
  success: z.boolean(),
  reason: z.string().optional(),
  newLink: LinkResSchema.optional(),
});

export const MultiLinkOpResSchema = z.object({
  success: z.boolean(),
  reason: z.string().optional(),
  newLinks: z.array(LinkResSchema).optional(),
  currentPage: z.number().optional(),
  totalPages: z.number().optional(),
});

export const ExportLinksResSchema = z.object({
  success: z.boolean(),
  reason: z.string().optional(),
  attachment: z.string().optional(),
});

export const ImportLinksResSchema = z.object({
  success: z.boolean(),
  reason: z.string().optional(),
});

export type LinkOpRes = z.infer<typeof LinkOpResSchema>;
export type MultiLinkOpRes = z.infer<typeof MultiLinkOpResSchema>;
export type ExportLinksRes = z.infer<typeof ExportLinksResSchema>;
export type ImportLinksRes = z.infer<typeof ImportLinksResSchema>;

export function deleteLink(linkId: number, userId: number): LinkOpRes {
  const link = dbGetLink(linkId);
  if (!link) {
    return { success: false, reason: `Cannot delete link with id ${linkId} - not found` };
  }
  if (link.userId !== userId) {
    return { success: false, reason: `Cannot delete link with id ${linkId} - not owned by user ${userId}` };
  }

  dbDeleteLink(linkId);
  deleteLinkTagByLinkId(linkId);

  return { success: true };
}

export function updateLink(userId: number, data: UpdateLinkReq): LinkOpRes {
  const { id: linkId } = data;
  const link = dbGetLink(linkId);
  if (!link) {
    return { success: false, reason: `Cannot update link with id ${linkId} - not found` };
  }
  if (link.userId !== userId) {
    return { success: false, reason: `Cannot update link with id ${linkId} - not owned by user ${userId}` };
  }

  const newLink = dbUpdateLink(linkId, data); // ignores tags

  if (!newLink) {
    return { success: false, reason: `Failed to update link with id ${linkId}` };
  }

  if (!data.tags) {
    logger.debug('Updated link - no tag changes', { linkId, userId });
    return { success: true, newLink };
  }

  // delete old LinkTag associations
  deleteLinkTagByLinkId(linkId);

  // get or create new tags
  const tagIdsForLink = getOrCreateTagsByName(data.tags).map((tag) => tag.id);
  createLinkTags(linkId, tagIdsForLink);

  logger.debug('Updated link - tag changes', { linkId, userId });

  const res = LinkResSchema.parse({ ...newLink, tags: data.tags });

  return LinkOpResSchema.parse({ success: true, newLink: res });
}

export function createLink(userId: number, data: CreateLinkReq): LinkOpRes {
  const { tags, ...linkData } = data;
  if (!linkData.isPublic) {
    linkData.isPublic = false;
  }
  const link = dbCreateLink(userId, linkData);

  if (!link) {
    return { success: false, reason: 'Failed to create link' };
  }

  if (tags) {
    const tagIdsForLink = getOrCreateTagsByName(tags).map((tag) => tag.id);
    createLinkTags(link.id, tagIdsForLink);
  }

  const res = LinkResSchema.parse({ ...link, tags });

  return LinkOpResSchema.parse({ success: true, newLink: res });
}

export function getLink(linkId: number): LinkOpRes {
  const link = dbGetLink(linkId);

  if (!link) {
    return { success: false, reason: `Failed to get link with id ${linkId}` };
  }

  const tagIds = getLinkTagsByLinkId(linkId).map((linkTag) => linkTag.tagId);
  const tags = getTagsById(tagIds);

  const res = LinkResSchema.parse({ ...link, tags });

  return LinkOpResSchema.parse({ success: true, newLink: res });
}

// TODO: disallow more than 100 per request if not signed in
export function getLinks(query: string, page: number, limit: number): MultiLinkOpRes {
  const offset = (page - 1) * limit;

  const searchTerms = query.split(' ').filter((term) => term.length > 0);

  const tagsFilter = searchTerms
    .filter((term) => term.startsWith('#'))
    .map((term) => term.slice(1))
    .filter((term) => term.length > 0);

  const titleDescriptionUrlFilter = searchTerms
    .filter((term) => !term.startsWith('#'))
    .filter((term) => term.length > 0);

  const results = dbFindLinks(titleDescriptionUrlFilter, tagsFilter, offset, limit);
  const totalLinks = dbFindLinksCount(titleDescriptionUrlFilter, tagsFilter);
  const totalPages = Math.ceil(totalLinks / limit);

  logger.debug('getLinks', {
    query, page, limit, offset, totalLinks, totalPages, results: results?.length ?? 0,
  });
  return MultiLinkOpResSchema.parse({
    success: true,
    newLinks: results,
    currentPage: page,
    totalPages,
  });
}

function replaceUnusualWhitespace(text: string): string {
  // eslint-disable-next-line no-control-regex
  const unusualWhitespaceRegex = /[\u0085\u2028\u2029\u000C\u000B]/g;
  return text.replace(unusualWhitespaceRegex, ' ');
}

function exportBookmarks(links: LinkRes[]): string {
  const header = `<!DOCTYPE NETSCAPE-Bookmark-file-1>

<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">

<TITLE>Bookmarks</TITLE>

<H1>Bookmarks</H1>

<DL><p>
`;

  const footer = '\n</DL><p>';

  const bookmarks = links
    .map((link) => {
      const {
        title, url, description, tags, isPublic, savedAt,
      } = link;

      const dt = Math.floor(new Date(savedAt).getTime() / 1000);

      const tagsSection = tags && tags.length > 0 ? ` TAGS="${tags.join(',')}"` : '';
      const firstLine = `\t<DT><A HREF="${url}" ADD_DATE="${dt}" PRIVATE="${isPublic ? '0' : '1'}" ${tagsSection}>${title ?? ''}</A>\n`;
      if (!description) {
        return firstLine;
      }
      return `${firstLine}\n\t<DD>${description}\n`;
    })
    .join('\n');

  const bookmarkHTML = header + bookmarks + footer;
  return replaceUnusualWhitespace(bookmarkHTML);
}

export function exportLinks(userId: number): ExportLinksRes {
  const links = dbGetAllLinks(userId);
  logger.debug('exporting links', { userId, count: links.length });
  const bookmarks = exportBookmarks(links);
  return ExportLinksResSchema.parse({ success: true, bookmarks });
}

function parseNetscapeHTML(htmlContent: string, userId: number): LinkImport[] {
  const bookmarks: LinkImport[] = [];
  const dom = new JSDOM(htmlContent);
  const dtElements = dom.window.document.querySelectorAll('DT');

  dtElements.forEach((dtElement) => {
    const aElement = dtElement.querySelector('A');
    if (aElement) {
      const url = aElement.getAttribute('href');
      if (!url) {
        return;
      }
      const title = aElement.textContent?.trim();
      const tags = (aElement.getAttribute('tags') || '').split(',').map((tag) => tag.trim());
      const addTimestamp = aElement.getAttribute('add_date');
      const savedAt = addTimestamp ? new Date(parseInt(addTimestamp, 10) * 1000) : new Date();
      const isPrivate = aElement.getAttribute('private') === '1';

      const ddElement = dtElement.nextElementSibling;
      const description = ddElement && ddElement.tagName === 'DD' ? ddElement.textContent?.trim() : '';

      bookmarks.push({
        url,
        title,
        tags,
        description,
        savedAt,
        isPublic: !isPrivate,
        userId,
      });
    }
  });

  return bookmarks;
}

function addBookmarksToDatabase(bookmarks: LinkImport[]): void {
  // TODO: perf++: use bulkCreate or queued promises w/ concurrency control
  const { userId } = bookmarks[0]; // all bookmarks should have the same userId
  const sock = wsHandler.connectionFor(userId);
  if (!sock) {
    logger.warn('no websocket connection found for user', { userId });
  }

  const totalBookmarks = bookmarks.length;

  const insertedIds = dbImportLinks(bookmarks);

  // add tags to each link
  for (let i = 0; i < bookmarks.length; i++) {
    const { tags } = bookmarks[i];

    if (tags && tags.length) {
      const linkId = insertedIds[i];
      const tagItems = getOrCreateTagsByName(tags);
      const tagIds = tagItems.map((tag) => tag.id);
      createLinkTags(linkId, tagIds);
    }

    // Send progress update after each link creation
    if (i % 10 === 0) {
      sock?.send(
        JSON.stringify({
          type: 'import-progress',
          data: { progress: (i / totalBookmarks) * 100 },
        }),
      );
    }
  }

  // Send final progress update
  sock?.send(JSON.stringify({ type: 'import-progress', data: { progress: 100 } }));
}

export function importLinks(htmlContent: string, userId: number): ImportLinksRes {
  const bookmarks = parseNetscapeHTML(htmlContent, userId);
  addBookmarksToDatabase(bookmarks);
  return ImportLinksResSchema.parse({ success: true });
}
