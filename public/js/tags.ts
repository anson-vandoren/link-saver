import { showNotification } from './notification';
import { getToken } from './utils';
import { purgeUnusedTags } from './apiClient';

export async function handlePurgeUnusedTags() {
  const numPurged = await purgeUnusedTags();
  const level = numPurged > 0 ? 'success' : 'info';
  showNotification(`Purged ${numPurged} unused tags.`, level);
}

const defaultCreateTagOpts = {
  shouldShowHash: true,
  isFirst: false,
  onClick: () => {},
};

export function createTagLink(tag: string, opts: Partial<typeof defaultCreateTagOpts>) {
  const { shouldShowHash, isFirst, onClick } = { ...defaultCreateTagOpts, ...opts };
  const tagLink = document.createElement('a');
  tagLink.classList.add('has-text-info');
  const tagWithHash = `#${tag}`;
  tagLink.textContent = `${shouldShowHash ? '#' : ''}${tag} `;
  // if it's the first tag, <strong> the first character and make the first character uppercase
  if (isFirst) {
    tagLink.innerHTML = `<strong>${tagLink.textContent[0].toUpperCase()}</strong>${tagLink.textContent.slice(1)}`;
  }

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
