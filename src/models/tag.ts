import { z } from 'zod';
import db from '../db';
import logger from '../logger';

export const TagSchema = z.object({
  id: z.number(),
  name: z.string(),
});

export const CreateTagInputSchema = TagSchema.omit({ id: true });

export type Tag = z.infer<typeof TagSchema>;
export type CreateTagInput = z.infer<typeof CreateTagInputSchema>;

export function createTag(name: string): Tag {
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

export function createTags(names: string[]): Tag[] {
  const placeholders = names.map(() => '(?)').join(', ');
  const insert = db.prepare(`INSERT INTO Tags (name) VALUES ${placeholders}`);

  insert.run(...names);

  const tagRows = db.prepare(`SELECT * FROM Tags WHERE name IN (${placeholders})`).all(names);
  const tags = tagRows.map((row) => TagSchema.parse(row));

  logger.debug('Created tags', { tags });
  return tags;
}

export function getTagById(id: number): Tag | undefined {
  const row = db.prepare('SELECT * FROM Tags WHERE id = ?').get(id);

  if (!row) {
    logger.debug('Tag not found', { id });
    return undefined;
  }
  logger.debug('Found tag', { id });
  return TagSchema.parse(row);
}

export function getTagsById(tagIds: number[]): Tag[] {
  const findTags = db.prepare('SELECT * FROM Tags WHERE id IN (?)');
  const rows = findTags.all(...tagIds);

  logger.debug('Found tags', { tagIds });
  return rows.map((row) => TagSchema.parse(row));
}

export function deleteTag(id: number): boolean {
  const deleteStmt = db.prepare('DELETE FROM Tags WHERE id = ?');

  const result = deleteStmt.run(id);

  logger.debug('Deleted tag', { id });
  return result.changes > 0;
}

export function deleteTags(tagIds: number[]): number {
  const deleteStmt = db.prepare('DELETE FROM Tags WHERE id IN (?)');

  const result = deleteStmt.run(tagIds);

  logger.debug('Deleted tags', { tagIds });
  return result.changes;
}

// TODO: maybe wrap this in a transaction?
export function getOrCreateTagsByName(tagNames: string[]): Tag[] {
  // First, retrieve all the existing tags by their names
  const rows = db.prepare('SELECT * FROM Tags WHERE name IN (?)').all(...tagNames);
  // Parse the rows into Tag objects
  const results: Tag[] = rows.map((row) => TagSchema.parse(row));

  const tagsToCreate = tagNames.filter((tagName) => !results.find((tag) => tag.name === tagName));

  const newTags = createTags(tagsToCreate);

  return [...results, ...newTags];
}

export function updateTag(id: number, input: Partial<Omit<Tag, 'id'>>): Tag | undefined {
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
