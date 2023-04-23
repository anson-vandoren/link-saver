# PagePouch

PagePouch is a web application for managing and organizing your bookmarks. It allows you to add,
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

### Setup

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
JWT_SECRET=someFuckingSecret
DB_PATH=./your_db_path.sqlite3
```

5. Start the backend server:

```
npm run dev # or npm run start if you don't need debugging
```

You can now access the service


## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details
