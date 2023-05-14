import { z } from 'zod';
import db from '../db';

const LinkTagSchema = z.object({
  linkId: z.number(),
  tagId: z.number(),
});

type LinkTag = z.infer<typeof LinkTagSchema>;

function _createLinkTag(input: LinkTag): LinkTag {
  const { linkId, tagId } = input;

  const insert = db.prepare(`
    INSERT INTO LinkTags (linkId, tagId)
    VALUES (@linkId, @tagId)
  `);

  insert.run({ linkId, tagId });

  return input;
}

export function createLinkTags(linkId: number, tagIds: number[]): LinkTag[] {
  // insert as many rows as there are tagIds, each with the same linkId
  const placeholders = tagIds.map(() => '(?, ?)').join(', ');
  const insert = db.prepare(`
    INSERT INTO LinkTags (linkId, tagId)
    VALUES ${placeholders}
  `);

  const params = tagIds.flatMap((tagId) => [linkId, tagId]);
  insert.run(...params);

  const linkTags = tagIds.map((tagId) => ({ linkId, tagId }));

  return linkTags;
}

export function getLinkTagsByLinkId(linkId: number): LinkTag[] {
  const select = db.prepare(`
    SELECT linkId, tagId
    FROM LinkTags
    WHERE linkId = ?
  `);

  const linkTags: LinkTag[] = select.all(linkId) as LinkTag[];

  return linkTags;
}

function _getLinkTagsByTagId(tagId: number): LinkTag[] {
  const select = db.prepare(`
    SELECT linkId, tagId
    FROM LinkTags
    WHERE tagId = ?
  `);

  const linkTags: LinkTag[] = select.all(tagId) as LinkTag[];

  return linkTags;
}

function _deleteLinkTag(input: LinkTag): boolean {
  const { linkId, tagId } = input;

  const deleteStmt = db.prepare(`
    DELETE FROM LinkTags
    WHERE linkId = ? AND tagId = ?
  `);

  const result = deleteStmt.run(linkId, tagId);

  return result.changes > 0;
}

export function deleteLinkTagByLinkId(linkId: number): boolean {
  const deleteStmt = db.prepare(`
    DELETE FROM LinkTags
    WHERE linkId = ?
  `);

  const result = deleteStmt.run(linkId);

  return result.changes > 0;
}
