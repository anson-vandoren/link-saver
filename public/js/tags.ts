import { showNotification } from './notification';
import { getToken } from './utils';

export async function handlePurgeUnusedTags() {
  const errMsg = 'Failed to purge unused tags. Please try again later.';
  try {
    const response = await fetch('/api/tags/purge-unused', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken()}`,
      },
    });

    if (response.ok) {
      showNotification('Unused tags have been purged.', 'success');
    } else {
      showNotification(errMsg, 'warning');
    }
  } catch (error) {
    showNotification(errMsg, 'warning');
  }
}

const defaultCreateTagOpts = {
  shouldShowHash: true,
  isFirst: false,
  onClick: () => {},
};

export function createTagLink(tag: string, opts = defaultCreateTagOpts) {
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
