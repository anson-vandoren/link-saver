export function handleLogoutButtonClick() {
  localStorage.removeItem('token');
  window.location.href = '/';
}
