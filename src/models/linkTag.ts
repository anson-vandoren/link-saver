import { z } from 'zod';
import type { Database } from 'better-sqlite3';

const LinkTagSchema = z.object({
  linkId: z.number(),
  tagId: z.number(),
});

type LinkTag = z.infer<typeof LinkTagSchema>;

function createLinkTags(db: Database, linkId: number, tagIds: number[]): LinkTag[] {
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

function getLinkTagsByLinkId(db: Database, linkId: number): LinkTag[] {
  const select = db.prepare(`
    SELECT linkId, tagId
    FROM LinkTags
    WHERE linkId = ?
  `);

  const linkTags: LinkTag[] = select.all(linkId) as LinkTag[];

  return linkTags;
}

function deleteLinkTagByLinkId(db: Database, linkId: number): boolean {
  const deleteStmt = db.prepare(`
    DELETE FROM LinkTags
    WHERE linkId = ?
  `);

  const result = deleteStmt.run(linkId);

  return result.changes > 0;
}

export class LinkTagModel {
  constructor(private db: Database) { }

  create(linkId: number, tagId: number | number[]): LinkTag[] {
    const tagIds = Array.isArray(tagId) ? tagId : [tagId];
    return createLinkTags(this.db, linkId, tagIds);
  }

  getByLinkId(linkId: number): LinkTag[] {
    return getLinkTagsByLinkId(this.db, linkId);
  }

  deleteByLinkId(linkId: number): boolean {
    return deleteLinkTagByLinkId(this.db, linkId);
  }
}
