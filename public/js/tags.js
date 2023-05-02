import { showNotification } from './common.js';

async function handlePurgeUnusedTags() {
  const errMsg = 'Failed to purge unused tags. Please try again later.';
  try {
    const response = await fetch('/api/tags/purge-unused', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
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

export default handlePurgeUnusedTags;
