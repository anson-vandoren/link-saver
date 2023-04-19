export function applyStoredTheme() {
  const storedTheme = localStorage.getItem('theme');
  if (storedTheme) {
    document.body.classList.toggle('dark', storedTheme === 'dark');
  }
}
