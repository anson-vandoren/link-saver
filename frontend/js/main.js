$(document).ready(function () {
  const apiUrl = 'http://localhost:3001';

  function loadLinks() {
    const token = localStorage.getItem('token');
    if (!token) {
      // If no token is found, redirect to the login page
      window.location.href = 'login.html';
      return;
    }

    // Fetch saved links from the backend API
    $.ajax({
      type: 'GET',
      url: `${apiUrl}/api/links`,
      headers: { Authorization: `Bearer ${token}` },
      success: function (response) {
        // Display the saved links
        const linkList = $('#link-list');
        linkList.empty();
        response.links.forEach((link) => {
          const listItem = `<li class="list-group-item">
                              <h5>${link.title}</h5>
                              <a href="${link.url}" target="_blank">${link.url}</a>
                              <p>Tags: ${link.tags.join(', ')}</p>
                              <p>Visibility: ${link.visibility}</p>
                            </li>`;
          linkList.append(listItem);
        });
      },
      error: function (error) {
        // Handle error (e.g., show an error message or redirect to the login page)
        alert('Error fetching links. Please try again.');
      },
    });

  }

  // Load saved links when the page loads
  loadLinks();

  // Add-link form submission handler
  $('#add-link-form').submit(function (e) {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const title = $('#link-title').val();
    const url = $('#link-url').val();
    const tags = $('#link-tags')
      .val()
      .split(',')
      .map((tag) => tag.trim());
    const visibility = $('#link-visibility').val();

    // Send the new link to the backend API
    $.ajax({
      type: 'POST',
      url: `${apiUrl}/api/links`,
      headers: { Authorization: `Bearer ${token}` },
      data: JSON.stringify({ title, url, tags, visibility }),
      contentType: 'application/json',
      success: function (response) {
        // Add the new link to the list and clear the form inputs
        loadLinks();
        $('#link-title').val('');
        $('#link-url').val('');
        $('#link-tags').val('');
      },
      error: function (error) {
        // Handle error (e.g., show an error message)
        alert('Error adding link. Please try again.');
      },
    });
  });

  // Logout button click handler
  $('#logout-btn').click(function () {
    localStorage.removeItem('token');
    window.location.href = 'login.html';
  });
});
