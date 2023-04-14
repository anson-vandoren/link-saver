# Link Saver

Link Saver is a web application for managing and organizing your bookmarks. It allows you to add,
edit, and delete links, as well as import bookmarks from the Netscape HTML format.

## Getting Started

These instructions will help you set up and run the frontend and backend locally for development and
testing purposes.

### Prerequisites

You will need the following software installed on your machine:

- Node.js (v14 or higher)
- npm (v6 or higher)

### Installing

1. Clone the repository:

```
git clone https://github.com/anson-vandoren/link-saver.git
```

2. Navigate to the project root directory:

```
cd link-saver
```

### Backend

To set up and run the backend, follow these steps:

1. Navigate to the backend directory:

```
cd backend
```

2. Install the required dependencies:

```
npm install
```

3. Create a `.env` file in the root directory of the backend:

```
touch .env
```

4. Add the following environment variables to the `.env` file:

```
PORT=3001
JWT_SECRET=someFuckingSecret
DB_PATH=./your_db_path.sqlite3
```

5. Start the backend server:

```
npm start
```

The backend server should now be running at http://localhost:3001

### Frontend

To set up and run the frontend, follow these steps:

1. Navigate to the frontend directory:

```
cd frontend
```

2. Update `js/common.js` `API_URL` to match however you configured the backend.

3. Open the `index.html` file in your preferred web browser or use a local web server such as
"Live Server" for Visual Studio Code. If using "Live Server", right-click on the `index.html` file
and select "Open with Live Server".

The frontend should now be running and accessible in your web browser.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details
