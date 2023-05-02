import handleSignupFormSubmit from './auth/signup.js';

document.addEventListener('DOMContentLoaded', () => {
  const signupForm = document.getElementById('signup-form');
  signupForm.addEventListener('submit', handleSignupFormSubmit);
});
