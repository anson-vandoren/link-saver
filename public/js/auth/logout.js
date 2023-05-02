function handleLogoutButtonClick() {
  localStorage.removeItem('token');
  window.location.href = '/';
}

export default handleLogoutButtonClick;
