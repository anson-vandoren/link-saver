import { dbGetUnusedTags, dbSearchTags, deleteTags } from '../models/tag';

// TODO: rate limit
export function getTags(query = '', sortBy = 'name'): string[] {
  const searchTerms = query.split(' ');

  const tagTerms = searchTerms
    .filter((term) => term.startsWith('#'))
    .map((term) => term.slice(1));

  const linkTerms = searchTerms
    .filter((term) => !term.startsWith('#') && term !== '');

  const tags = dbSearchTags(tagTerms, linkTerms, sortBy);

  return tags;
}

// TODO: if we go to multi-user, this will need some checks
export function purgeUnusedTags(): number {
  const unusedTags = dbGetUnusedTags();
  const unusedTagIds = unusedTags.map((tag) => tag.id);
  deleteTags(unusedTagIds);
  return unusedTagIds.length;
}
