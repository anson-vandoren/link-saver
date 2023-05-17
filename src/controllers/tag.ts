import type { DbContext } from '../db';

// TODO: rate limit
export function getTags(db: DbContext, query = '', sortBy = 'name'): string[] {
  const searchTerms = query.split(' ');

  const tagTerms = searchTerms
    .filter((term) => term.startsWith('#'))
    .map((term) => term.slice(1));

  const linkTerms = searchTerms
    .filter((term) => !term.startsWith('#') && term !== '');

  const filter = {
    tagTerms,
    linkTerms,
  };
  const tags = db.Tag.search(filter, sortBy);

  return tags;
}

export function purgeUnusedTags(db: DbContext): number {
  const unusedTags = db.Tag.unused();
  const unusedTagIds = unusedTags.map((tag) => tag.id);
  db.Tag.delete(unusedTagIds);
  return unusedTagIds.length;
}
