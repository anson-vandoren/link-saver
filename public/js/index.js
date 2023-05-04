import { loadLinks, tagOnClick } from './links.js';
import { loadTags } from './tagsBar.js';
import { loginDropdownHandler, loginSubmitHandler } from './auth/login.js';

document.addEventListener('DOMContentLoaded', () => {
  loginDropdownHandler();
  loginSubmitHandler();
  loadLinks();
  loadTags(tagOnClick);
});
