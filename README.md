# PagePouch

PagePouch is a web application for managing and organizing your bookmarks. It allows you to add,
edit, and delete links, as well as import & export bookmarks from/to the Netscape HTML format.

## Setting up in production

### With Docker:

Take a look at the `installPagepouch.sh` script. If you just want to run this app locally
or on your own server, you can copy this script to your server and run it to install and
run the docker image. Available environment variables are:

- `PP_PORT`: The port the app will listen on. Defaults to 9090
- `PP_DATA_DIR`: The directory where the app will store its data (an SQLite3 database). Defaults 
  to `/etc/pagepouch/data`
- `PP_VERSION`: The version tag of the Docker container to run. Defaults to `latest`

### Without Docker:

- Clone the repo on your server

```bash
git clone https://github.com/anson-vandoren/pagepouch.git
```

- Install dependencies

```bash
cd pagepouch
npm install
```

- Build the app

```bash
npm run build-prod
```

- Run the app

```bash
node dist/index.cjs
```

## Getting Started for Development

These instructions will help you set up and run the frontend and backend locally for development and
testing purposes.

### Prerequisites

You will need the following software installed on your machine:

- Node.js (targeted to 18.12.1 but probably works on older)
- npm (v6 or higher)

### Installing for Development

1. Clone the repository:

```
git clone https://github.com/anson-vandoren/pagepouch.git
```

2. Navigate to the project root directory:

```
cd pagepouch
```

### Setup for Development

1. Install dependencies:

```
npm install
```

2. Run the dev server locally:

```
npm run dev
```

You can now access the service at `http://localhost:3001`


## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details
