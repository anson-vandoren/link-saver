import { loadLinks, loadTags } from './common.js';
import { loginDropdownHandler, loginSubmitHandler } from './auth/login.js';

document.addEventListener('DOMContentLoaded', () => {
  loginDropdownHandler();
  loginSubmitHandler();
  loadLinks();
  loadTags();
});
