import { showNotification } from './notification';

export async function exportBookmarks() {
  try {
    const response = await fetch('/api/links/export', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
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
