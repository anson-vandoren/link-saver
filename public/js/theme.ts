// Example theme object
// {
//     "name": "Yeti",
//     "description": "A friendly foundation",
//     "preview": "https://jenil.github.io/bulmaswatch/yeti/",
//     "thumb": "https://jenil.github.io/bulmaswatch/thumb/?yeti",
//     "css": "https://unpkg.com/bulmaswatch@0.8.1/yeti/bulmaswatch.min.css",
//     "scss": "https://unpkg.com/bulmaswatch@0.8.1/yeti/bulmaswatch.scss",
//     "scssVariables": "https://unpkg.com/bulmaswatch@0.8.1/yeti/_variables.scss"
// }
type Theme = {
  name: string;
  description: string;
  preview: string;
  thumb: string;
  css: string;
  scss: string;
  scssVariables: string;
};
type BulmaSwatchAPIResult = {
  'version': string;
  'themes': Theme[];
};

async function fetchThemes(): Promise<Theme[]> {
  const response = await fetch('https://jenil.github.io/bulmaswatch/api/themes.json');
  const data = await response.json() as BulmaSwatchAPIResult;
  return data.themes;
}

export async function populateThemeDropdown(): Promise<void> {
  const themeSelector = document.getElementById('theme-selector');
  if (!themeSelector || !(themeSelector instanceof HTMLSelectElement)) return;
  const themes = await fetchThemes();

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

export function saveThemeHandler(): void {
  const themeSelector = document.getElementById('theme-selector');
  if (!themeSelector || !(themeSelector instanceof HTMLSelectElement)) return;

  themeSelector.addEventListener('change', (event) => {
    if (!(event.target instanceof HTMLSelectElement)) return;
    const selectedTheme = event.target.value;
    if (!selectedTheme) return;
    const stylesheetLink = document.getElementById('theme-stylesheet');
    if (!stylesheetLink || !(stylesheetLink instanceof HTMLLinkElement)) return;
    stylesheetLink.href = selectedTheme;
    localStorage.setItem('selectedTheme', selectedTheme);
  });
}
