import { showNotification } from './notification';
import { getToken } from './utils';

export async function exportBookmarks() {
  try {
    const response = await fetch('/api/links/export', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken()}`,
      },
    });

    if (!response.ok) {
      throw new Error('Error exporting bookmarks');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bookmarks.html';
    document.body.appendChild(a);
    a.click();
    a.remove();
  } catch (error) {
    showNotification('Failed to export bookmarks. Check server logs for more details', 'danger');
  }
}
/*
import { trpc } from '../utils/trpc'; // import your trpc client instance

async function downloadExportedLinks() {
  try {
    const response = await trpc.query('export');
    if (response.success && response.attachment) {
      const base64Attachment = response.attachment;
      const blob = new Blob([atob(base64Attachment)], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'bookmarks.html';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else {
      // handle error
    }
  } catch (error) {
    // handle error
  }
}

downloadExportedLinks();
*/
