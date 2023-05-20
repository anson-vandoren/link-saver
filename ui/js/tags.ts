import { showNotification } from './notification';
import { purgeUnusedTags } from './apiClient';

export async function handlePurgeUnusedTags() {
  const numPurged = await purgeUnusedTags();
  const level = numPurged > 0 ? 'success' : 'info';
  showNotification(`Purged ${numPurged} unused tags.`, level);
}

const defaultCreateTagOpts = {
  shouldShowHash: true,
  onClick: () => {},
};

export function createTagLink(tag: string, opts: Partial<typeof defaultCreateTagOpts>) {
  const { shouldShowHash, onClick } = { ...defaultCreateTagOpts, ...opts };
  const tagLink = document.createElement('a');
  tagLink.classList.add('has-text-info');
  const tagWithHash = `#${tag}`;
  tagLink.textContent = `${shouldShowHash ? '#' : ''}${tag} `;

  const searchInput = document.getElementById('search-input');
  if (!searchInput || !(searchInput instanceof HTMLInputElement)) {
    return tagLink;
  }
  tagLink.addEventListener('click', (e) => {
    e.preventDefault();
    searchInput.value = tagWithHash;
    onClick();
  });

  return tagLink;
}
