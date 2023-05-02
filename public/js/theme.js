async function fetchThemes() {
  const response = await fetch('https://jenil.github.io/bulmaswatch/api/themes.json');
  const data = await response.json();
  return data.themes;
}

export async function populateThemeDropdown() {
  const themes = await fetchThemes();
  const themeSelector = document.getElementById('theme-selector');

  // Retrieve the current theme from local storage or use the default theme
  const currentTheme = localStorage.getItem('selectedTheme') || 'https://unpkg.com/bulmaswatch@0.8.1/darkly/bulmaswatch.min.css';

  themes.forEach((theme) => {
    const option = document.createElement('option');
    option.value = theme.css;
    option.textContent = theme.name;

    // If the theme matches the current theme, set the option as selected
    if (theme.css === currentTheme) {
      option.selected = true;
    }

    themeSelector.appendChild(option);
  });
}

export function saveThemeHandler() {
  const themeSelector = document.getElementById('theme-selector');

  themeSelector.addEventListener('change', (event) => {
    const selectedTheme = event.target.value;
    const stylesheetLink = document.getElementById('theme-stylesheet');
    stylesheetLink.href = selectedTheme;
    localStorage.setItem('selectedTheme', selectedTheme);
  });
}
