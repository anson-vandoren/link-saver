import { ErrorResponse, RegisterUserResponse } from '../../../shared/apiTypes';
import { showNotification } from '../notification';

async function handleSignupFormSubmit(event: Event) {
  event.preventDefault();
  const submitButton = (event.target as HTMLFormElement).querySelector('button[type="submit"]');
  if (!(submitButton instanceof HTMLButtonElement)) {
    throw new Error('Could not find submit button');
  }
  submitButton.disabled = true;

  const formData = new FormData(event.target as HTMLFormElement);
  const username = formData.get('username') as string;
  const password = formData.get('password') as string;

  const response = await fetch('/api/users/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password }),
  });

  if (response.ok) {
    const { token } = await response.json() as RegisterUserResponse;
    localStorage.setItem('token', token);
    window.location.href = 'bookmarks.html';
  } else {
    const { error } = await response.json() as ErrorResponse;
    showNotification(error, 'danger');
    if (submitButton) {
      submitButton.disabled = false;
    }
  }
}
function handleSignupForm() {
  const signupForm = document.getElementById('signup-form');
  if (!(signupForm instanceof HTMLFormElement)) {
    throw new Error('Could not find signup form');
  }
  signupForm.addEventListener('submit', (event) => {
    handleSignupFormSubmit(event).catch((error: unknown) => {
      const message = error instanceof Error ? error.message : 'Unknown error';
      showNotification(message, 'danger');
    });
  });
}

export { handleSignupForm };
