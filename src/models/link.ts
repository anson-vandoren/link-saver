import db from '../db';
import type { CreateLinkReq, Link, LinkImport, LinkRes, LinkWithTags } from '../schemas/link';
import { LinkSchema, LinkSchemaWithTags, LinkWithTagRowSchema } from '../schemas/link';

export function dbCreateLink(userId: number, input: CreateLinkReq): Link {
  const { url, title, description, isPublic } = input;
  const savedAt = new Date();

  const insert = db.prepare(`
    INSERT INTO Links (url, title, description, savedAt, isPublic, userId)
    VALUES (@url, @title, @description, @savedAt, @isPublic, @userId)
  `);

  const result = insert.run({
    url,
    title,
    description,
    savedAt,
    isPublic,
    userId,
  });
  const id = result.lastInsertRowid;

  if (typeof id === 'bigint') {
    throw new Error(`Exceeded maximum id value: ${id}`);
  }

  return {
    id,
    url,
    title,
    description,
    savedAt,
    isPublic,
    userId,
  };
}

export function dbImportLinks(links: LinkImport[]): number[] {
  const numProperties = Object.getOwnPropertyNames(links[0]).length;
  // SQLite has a default limit of 999 parameters per query
  const batchSize = Math.floor(999 / numProperties);
  const numBatches = Math.ceil(links.length / batchSize);
  let createdIds: number[] = [];

  for (let i = 0; i < numBatches; i++) {
    const batchLinks = links.slice(i * batchSize, (i + 1) * batchSize);
    const placeholders = Array(numProperties).fill('?').join(', ');
    const valuesString = batchLinks.map(() => `(${placeholders})`).join(', ');
    const bulkInsert = db.prepare(`
      INSERT INTO Links (url, title, description, savedAt, isPublic, userId)
      VALUES ${valuesString}
    `);

    const params = batchLinks.flatMap((link) => [
      link.url,
      link.title,
      link.description,
      link.savedAt,
      link.isPublic,
      link.userId,
    ]);

    const result = bulkInsert.run(params);

    const firstId = result.lastInsertRowid;
    const numRows = result.changes;

    if (typeof firstId === 'bigint') {
      throw new Error(`Exceeded maximum id value: ${firstId}`);
    }

    // Add the created ids in order for the current batch
    const batchCreatedIds: number[] = Array.from({ length: numRows }, (_, j) => Number(firstId) + j);
    createdIds = createdIds.concat(batchCreatedIds);
  }

  return createdIds;
}

export function dbGetLink(id: number, includeUserId = true): Link | undefined {
  const select = `L.id, L.url, L.title, L.description, L.savedAt, L.isPublic, ${includeUserId ? 'L.userId' : ''}`;
  const row = db.prepare(`SELECT ${select} FROM Links WHERE id = ?`).get(id);

  return row ? LinkSchema.parse(row) : undefined;
}

export function dbGetAllLinks(userId?: number): LinkWithTags[] {
  // if userId is undefined, return all links where isPublic: true
  // otherwise, return all links where userId = userId

  const whereClause = userId === undefined ? 'isPublic = 1' : 'userId = ?';
  const query = `
    SELECT
      L.*, T.name AS tagName
    FROM
      Links L
      LEFT JOIN LinkTags LT ON L.id = LT.linkId
      LEFT JOIN Tags T ON LT.tagId = T.id
    WHERE
      ${whereClause}
    ORDER BY savedAt DESC
  `;
  const rows = db.prepare(query).all(userId);

  return rows.map((row) => LinkSchemaWithTags.parse(row));
}

export function dbFindLinks(terms: string[], tagTerms: string[], offset: number, limit: number, includeUserId = true): LinkRes[] | undefined {
  const termsLikeQuery = terms.map(() => '(url LIKE ? OR title LIKE ? OR description LIKE ?)').join(' OR ');

  const tagTermsInQuery = tagTerms.map(() => '?').join(', ');

  // TODO: probably not ordered correctly
  const query = `
    SELECT
      L.id, L.url, L.title, L.description, L.savedAt, L.isPublic, ${includeUserId ? 'L.userId,' : ''},
      T.name AS tagName
    FROM
      Links L
      LEFT JOIN LinkTags LT ON L.id = LT.linkId
      LEFT JOIN Tags T ON LT.tagId = T.id
    WHERE
      (${termsLikeQuery})
      OR T.name IN (${tagTermsInQuery})
    LIMIT ? OFFSET ?
  `;

  const termsParams = terms.flatMap((term) => [`%${term}%`, `%${term}%`, `%${term}%`]);
  const allParams = [...termsParams, ...tagTerms, limit, offset];

  const rows = db.prepare(query).all(allParams);
  const validatedRows = rows.map((row) => LinkWithTagRowSchema.parse(row));

  const linksMap: Map<number, LinkRes & { tags: string[] }> = new Map();

  for (const row of validatedRows) {
    const linkId = row.id;
    let link = linksMap.get(linkId);

    if (!link) {
      link = {
        id: linkId,
        url: row.url,
        title: row.title,
        description: row.description,
        savedAt: row.savedAt,
        isPublic: row.isPublic,
        tags: [],
      };
      linksMap.set(linkId, link);
    }

    if (row.tagName && !link.tags.includes(row.tagName)) {
      link.tags.push(row.tagName);
    }
  }

  return Array.from(linksMap.values());
}

export function dbFindLinksCount(terms: string[], tagTerms: string[]): number {
  const termsLikeQuery = terms.map(() => '(url LIKE ? OR title LIKE ? OR description LIKE ?)').join(' OR ');

  const tagTermsInQuery = tagTerms.map(() => '?').join(', ');

  const query = `
    SELECT
      COUNT(DISTINCT L.id) AS totalCount
    FROM
      Links L
      LEFT JOIN LinkTags LT ON L.id = LT.linkId
      LEFT JOIN Tags T ON LT.tagId = T.id
    WHERE
      (${termsLikeQuery})
      OR T.name IN (${tagTermsInQuery})
  `;

  const termsParams = terms.flatMap((term) => [`%${term}%`, `%${term}%`, `%${term}%`]);
  const allParams = [...termsParams, ...tagTerms];

  const result = db.prepare(query).get(allParams) as { totalCount: number } | undefined;
  return result?.totalCount ?? 0;
}

export function dbUpdateLink(id: number, updates: Partial<CreateLinkReq>): Link | undefined {
  const currentLink = dbGetLink(id);

  if (!currentLink) {
    return undefined;
  }

  // updates may include tags, which we don't want to save here, so we omit them
  const { tags: _tags, ...updatesWithoutTags } = updates;

  const newLink = {
    ...currentLink,
    ...updatesWithoutTags,
  };

  // if userId or savedAt are different, throw
  if (newLink.userId !== currentLink.userId) {
    throw new Error('Cannot change userId');
  }

  if (newLink.savedAt !== currentLink.savedAt) {
    throw new Error('Cannot change savedAt');
  }

  const update = db.prepare(`
    UPDATE Links
    SET url = @url, title = @title, description = @description, isPublic = @isPublic
    WHERE id = @id
  `);

  update.run(newLink);

  return newLink;
}

export function dbDeleteLink(id: number): boolean {
  const deleteStmt = db.prepare('DELETE FROM Links WHERE id = ?');

  const result = deleteStmt.run(id);

  return result.changes > 0;
}
