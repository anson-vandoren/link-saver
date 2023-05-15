import db from '../db';
import type { DbLink, DbLinkWithTags, NewDbLink } from '../schemas/link';
import { DbLinkRowWithTagSchema, DbLinkSchema, DbLinkWithTagsSchema } from '../schemas/link';

export function dbCreateLink(userId: number, input: NewDbLink): DbLink {
  const { url, title, description, isPublic } = input;
  const savedAt = Date.now();

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

export function dbImportLinks(links: NewDbLink[]): number[] {
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

export function dbGetLink(id: number, includeUserId = true): DbLink | undefined {
  const select = `L.id, L.url, L.title, L.description, L.savedAt, L.isPublic, ${includeUserId ? 'L.userId' : ''}`;
  const row = db.prepare(`SELECT ${select} FROM Links WHERE id = ?`).get(id);

  return row ? DbLinkSchema.parse(row) : undefined;
}

export function dbGetAllLinks(userId?: number): DbLinkWithTags[] {
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

  return rows.map((row) => DbLinkWithTagsSchema.parse(row));
}

export function dbFindLinks(
  terms: string[],
  tagTerms: string[],
  offset: number,
  limit: number,
): DbLinkWithTags[] | undefined {
  const termsLikeQuery = terms.map(() => '(url LIKE ? OR title LIKE ? OR description LIKE ?)').join(' OR ');

  const tagTermsInQuery = tagTerms.map(() => '?').join(', ');

  const whereClauses: string[] = [];
  if (termsLikeQuery) {
    whereClauses.push(`(${termsLikeQuery})`);
  }
  if (tagTermsInQuery) {
    whereClauses.push(`T.name IN (${tagTermsInQuery})`);
  }
  const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' OR ')}` : '';

  // TODO: probably not ordered correctly
  const query = `
    SELECT
      L.id, L.url, L.title, L.description, L.savedAt, L.isPublic, L.userId,
      T.name AS tag
    FROM
      Links L
      LEFT JOIN LinkTags LT ON L.id = LT.linkId
      LEFT JOIN Tags T ON LT.tagId = T.id
    ${whereClause}
    LIMIT ? OFFSET ?
  `;

  const termsParams = terms.flatMap((term) => [`%${term}%`, `%${term}%`, `%${term}%`]);
  const allParams = [...termsParams, ...tagTerms, limit, offset];

  const rows = db.prepare(query).all(allParams);
  const validatedRows = rows.map((row) => DbLinkRowWithTagSchema.parse(row));

  const linksMap: Map<number, DbLinkWithTags> = new Map();

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
        userId: row.userId,
        tags: [],
      };
      linksMap.set(linkId, link);
    }

    if (row.tag && !link.tags.includes(row.tag)) {
      link.tags.push(row.tag);
    }
  }

  return Array.from(linksMap.values());
}

export function dbFindLinksCount(terms: string[], tagTerms: string[]): number {
  const termsLikeQuery = terms.map(() => '(url LIKE ? OR title LIKE ? OR description LIKE ?)').join(' OR ');

  const tagTermsInQuery = tagTerms.map(() => '?').join(', ');

  const whereClauses: string[] = [];
  if (termsLikeQuery) {
    whereClauses.push(`(${termsLikeQuery})`);
  }
  if (tagTermsInQuery) {
    whereClauses.push(`T.name IN (${tagTermsInQuery})`);
  }
  const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' OR ')}` : '';

  const query = `
    SELECT
      COUNT(DISTINCT L.id) AS totalCount
    FROM
      Links L
      LEFT JOIN LinkTags LT ON L.id = LT.linkId
      LEFT JOIN Tags T ON LT.tagId = T.id
    ${whereClause}
  `;

  const termsParams = terms.flatMap((term) => [`%${term}%`, `%${term}%`, `%${term}%`]);
  const allParams = [...termsParams, ...tagTerms];

  const result = db.prepare(query).get(allParams) as { totalCount: number } | undefined;
  return result?.totalCount ?? 0;
}

export function dbUpdateLink(id: number, updates: Partial<DbLinkWithTags>): DbLinkWithTags | undefined {
  const currentLink = dbGetLink(id);

  if (!currentLink) {
    return undefined;
  }

  // Tags should be updated separately
  const { tags, ...updatesWithoutTags } = updates;

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

  return {
    ...newLink,
    tags: tags ?? [],
  };
}

export function dbDeleteLink(id: number): boolean {
  const deleteStmt = db.prepare('DELETE FROM Links WHERE id = ?');

  const result = deleteStmt.run(id);

  return result.changes > 0;
}
