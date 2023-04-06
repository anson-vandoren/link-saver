$(document).ready(function () {
  const apiUrl = 'http://localhost:3001';

  // Login form submission handler
  $('#login-form').submit(function (e) {
    e.preventDefault();
    const email = $('#login-email').val();
    const password = $('#login-password').val();

    // Send login request to backend API
    $.ajax({
      type: 'POST',
      url: `${apiUrl}/api/users/login`,
      data: JSON.stringify({ email, password }),
      contentType: 'application/json',
      success: function (response) {
        // Store the JWT token in localStorage and redirect to the main page
        localStorage.setItem('token', response.token);
        window.location.href = 'index.html';
      },
      error: function (error) {
        // Handle error (e.g., show an error message)
        alert('Error logging in. Please check your credentials.');
      },
    });
  });

  // Registration form submission handler
  $('#register-form').submit(function (e) {
    e.preventDefault();
    const email = $('#register-email').val();
    const password = $('#register-password').val();

    // Send registration request to backend API
    $.ajax({
      type: 'POST',
      url: `${apiUrl}/api/users/register`,
      data: JSON.stringify({ email, password }),
      contentType: 'application/json',
      success: function (response) {
        // Registration successful, redirect to the main page
        window.location.href = 'index.html';
      },
      error: function (error) {
        // Handle error (e.g., show an error message)
        alert('Error registering. Please try again.');
      },
    });
  });
});
