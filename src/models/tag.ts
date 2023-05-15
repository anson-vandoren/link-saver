import db from '../db';
import logger from '../logger';
import { TagSchema } from '../schemas/tag';
import type { Tag } from '../schemas/tag';

function _createTag(name: string): Tag {
  const insert = db.prepare(`
    INSERT INTO Tags (name)
    VALUES (@name)
  `);

  const id: number | bigint = insert.run({ name }).lastInsertRowid;

  if (typeof id === 'bigint') {
    throw new Error(`Exceeded maximum id value: ${id}`);
  }

  logger.debug('Created tag', { id, name });
  return { id, name };
}

function createTags(names: string[]): Tag[] {
  if (!names || !names.length) {
    return [];
  }
  const placeholders = names.map(() => '(?)').join(', ');
  const insert = db.prepare(`INSERT INTO Tags (name) VALUES ${placeholders}`);

  insert.run(...names);

  const tagRows = db.prepare(`SELECT * FROM Tags WHERE name IN (${placeholders})`).all(names);
  const tags = tagRows.map((row) => TagSchema.parse(row));

  logger.debug('Created tags', { tags });
  return tags;
}

function getTagById(id: number): Tag | undefined {
  const row = db.prepare('SELECT * FROM Tags WHERE id = ?').get(id);

  if (!row) {
    logger.debug('Tag not found', { id });
    return undefined;
  }
  logger.debug('Found tag', { id });
  return TagSchema.parse(row);
}

export function getTagsById(tagIds: number[]): Tag[] {
  if (!tagIds || !tagIds.length) {
    return [];
  }
  const placeholders = tagIds.map(() => '(?)').join(', ');
  const findTags = db.prepare(`SELECT * FROM Tags WHERE id IN (${placeholders})`);
  const rows = findTags.all(...tagIds);

  logger.debug('Found tags', { tagIds });
  return rows.map((row) => TagSchema.parse(row));
}

function _deleteTag(id: number): boolean {
  const deleteStmt = db.prepare('DELETE FROM Tags WHERE id = ?');

  const result = deleteStmt.run(id);

  logger.debug('Deleted tag', { id });
  return result.changes > 0;
}

export function deleteTags(tagIds: number[]): number {
  if (!tagIds || !tagIds.length) {
    return 0;
  }
  const placeholders = tagIds.map(() => '(?)').join(', ');
  const deleteStmt = db.prepare(`DELETE FROM Tags WHERE id IN (${placeholders})`);

  const result = deleteStmt.run(tagIds);

  logger.debug('Deleted tags', { tagIds });
  return result.changes;
}

// TODO: maybe wrap this in a transaction?
export function getOrCreateTagsByName(tagNames: string[]): Tag[] {
  if (!tagNames || !tagNames.length) {
    return [];
  }
  const placeholders = tagNames.map(() => '(?)').join(', ');
  // First, retrieve all the existing tags by their names
  const rows = db.prepare(`SELECT * FROM Tags WHERE name IN (${placeholders})`).all(tagNames);
  // Parse the rows into Tag objects
  const results: Tag[] = rows.map((row) => TagSchema.parse(row));

  const tagsToCreate = tagNames.filter((tagName) => !results.find((tag) => tag.name === tagName));

  const newTags = createTags(tagsToCreate);

  return [...results, ...newTags];
}

function _updateTag(id: number, input: Partial<Omit<Tag, 'id'>>): Tag | undefined {
  if (input.name === undefined) {
    return undefined;
  }

  const update = db.prepare(`
    UPDATE Tags
    SET name = ?
    WHERE id = ?
  `);
  const { changes } = update.run(input.name, id);

  if (changes === 0) {
    return undefined;
  }

  logger.debug('Updated tag', { id, ...input });
  return getTagById(id);
}

export function dbSearchTags(tagTerms: string[], linkTerms: string[], sortBy: string): string[] {
  const nonTagFilter = linkTerms.map(() => '(l.title LIKE ? OR l.description LIKE ? OR l.url LIKE ?)').join(' AND ');

  const tagsFilter = tagTerms
    .map(
      () => `
    (
      SELECT COUNT(*)
      FROM LinkTags lt2
      INNER JOIN Tags t2 ON lt2.tagId = t2.id
      WHERE lt2.linkId = l.id AND t2.name LIKE ?
    ) = 1`,
    )
    .join(' AND ');

  const whereClause = `
      WHERE (${nonTagFilter.length > 0 ? nonTagFilter : '1=1'})
      ${tagsFilter.length > 0 ? `AND (${tagsFilter})` : ''}
    `;

  const titleUrlParams = linkTerms
    .flatMap((term) => [`%${term}%`, `%${term}%`, `%${term}%`]);
  const tagSearchParams = tagTerms.map((term) => `%${term}%`);
  const allParams = [...titleUrlParams, ...tagSearchParams];

  const orderBy = sortBy === 'links' ? 'linkCount DESC, LOWER(name) ASC' : 'LOWER(name) ASC';

  const rows = db
    .prepare(
      `
    SELECT t.name, COUNT(lt.linkId) as linkCount
    FROM Tags t
    LEFT JOIN LinkTags lt ON t.id = lt.tagId
    LEFT JOIN Links l ON lt.linkId = l.id
    ${whereClause}
    GROUP BY t.id, t.name
    HAVING linkCount > 0
    ORDER BY ${orderBy}
  `,
    )
    .all(allParams) as { name: string; linkCount: number }[];

  return rows.map((row) => row.name);
}

export function dbGetUnusedTags(): Tag[] {
  const rows = db.prepare(`
    SELECT t.*
    FROM Tags t
    LEFT JOIN LinkTags lt ON t.id = lt.tagId
    WHERE lt.linkId IS NULL
  `).all();

  return rows.map((row) => TagSchema.parse(row));
}
