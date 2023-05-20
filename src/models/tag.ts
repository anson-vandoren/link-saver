import type { Database } from 'better-sqlite3';
import logger from '../logger';
import type { Tag } from '../schemas/tag';
import { TagSchema } from '../schemas/tag';

type SearchTerms = {
  tagTerms: string[];
  linkTerms: string[];
};

function createTags(db: Database, names: string[]): Tag[] {
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

function getTagsById(db: Database, tagIds: number[]): Tag[] {
  if (!tagIds || !tagIds.length) {
    return [];
  }
  const placeholders = tagIds.map(() => '(?)').join(', ');
  const findTags = db.prepare(`SELECT * FROM Tags WHERE id IN (${placeholders})`);
  const rows = findTags.all(...tagIds);

  logger.debug('Found tags', { tagIds });
  return rows.map((row) => TagSchema.parse(row));
}

function deleteTags(db: Database, tagIds: number[]): number {
  if (!tagIds || !tagIds.length) {
    return 0;
  }
  const placeholders = tagIds.map(() => '(?)').join(', ');
  const deleteStmt = db.prepare(`DELETE FROM Tags WHERE id IN (${placeholders})`);

  const result = deleteStmt.run(tagIds);

  logger.debug('Deleted tags', { tagIds });
  return result.changes;
}

function getOrCreateTagsByName(db: Database, tagNames: string[]): Tag[] {
  if (!tagNames || !tagNames.length) {
    return [];
  }
  const placeholders = tagNames.map(() => '(?)').join(', ');
  // First, retrieve all the existing tags by their names
  const rows = db.prepare(`SELECT * FROM Tags WHERE name IN (${placeholders})`).all(tagNames);
  // Parse the rows into Tag objects
  const results: Tag[] = rows.map((row) => TagSchema.parse(row));

  const tagsToCreate = tagNames.filter((tagName) => !results.find((tag) => tag.name === tagName));

  const newTags = createTags(db, tagsToCreate);

  return [...results, ...newTags];
}

function dbSearchTags(db: Database, terms: SearchTerms, sortBy: string): string[] {
  const { tagTerms, linkTerms } = terms;
  // TODO: this logic is mostly duped for Links - should be consolidated
  const nonTagFilter = linkTerms.map(() => '(l.title LIKE ? OR l.description LIKE ? OR l.url LIKE ?)').join(' OR ');

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

  const titleUrlParams = linkTerms.flatMap((term) => [`%${term}%`, `%${term}%`, `%${term}%`]);
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

function dbGetUnusedTags(db: Database): Tag[] {
  const rows = db
    .prepare(
      `
    SELECT t.*
    FROM Tags t
    LEFT JOIN LinkTags lt ON t.id = lt.tagId
    WHERE lt.linkId IS NULL
  `,
    )
    .all();

  return rows.map((row) => TagSchema.parse(row));
}

export class TagModel {
  constructor(private db: Database) { }

  get(tagId: number | number[]): Tag[] {
    const tagIds = Array.isArray(tagId) ? tagId : [tagId];
    return getTagsById(this.db, tagIds);
  }

  getOrCreate(tagNames: string | string[]): Tag[] {
    const tagNamesArray = Array.isArray(tagNames) ? tagNames : [tagNames];
    return getOrCreateTagsByName(this.db, tagNamesArray);
  }

  search(terms: SearchTerms, sortBy: string): string[] {
    return dbSearchTags(this.db, terms, sortBy);
  }

  unused(): Tag[] {
    return dbGetUnusedTags(this.db);
  }

  delete(tagId: number | number[]): number {
    const tagIds = Array.isArray(tagId) ? tagId : [tagId];
    return deleteTags(this.db, tagIds);
  }
}
