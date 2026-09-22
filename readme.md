# Link

A full-stack web application built with React and Express.js.

## Tech Stack

- **Frontend:** React
- **Backend:** Node.js and Express.js
- **Package manager:** npm

## Project Structure

```text
.
├── client/     # React application
└── server/     # Express API
```

## Prerequisites

Before getting started, install:

- [Node.js](https://nodejs.org/) (LTS version recommended)
- npm (included with Node.js)

## Getting Started

1. Clone the repository and enter the project directory:

   ```bash
   git clone <repository-url>
   cd link
   ```

2. Install the backend dependencies:

   ```bash
   cd server
   npm install
   ```

3. Install the frontend dependencies:

   ```bash
   cd ../client
   npm install
   ```

4. Create the required environment files. For example:

   ```env
   # server/.env
   PORT=5000
   ```

   Add any database credentials, API keys, or other project-specific settings required by the application. Do not commit `.env` files.

5. Start the Express server:

   ```bash
   cd server
   npm run dev
   ```

6. In a second terminal, start the React development server:

   ```bash
   cd client
   npm run dev
   ```

Open the local URL shown by the React development server in your browser.

## Available Scripts

Run these commands from the relevant `client` or `server` directory:

- `npm run dev` — starts the development server.
- `npm run build` — creates a production frontend build.
- `npm start` — starts the application in production mode.
- `npm test` — runs the test suite.

The exact scripts available are defined in each directory's `package.json` file.

## Production

Build the React application with:

```bash
cd client
npm run build
```

Configure Express to serve the generated frontend files, or deploy the frontend and API separately. Set production environment variables through your hosting provider.

## Contributing

1. Create a branch for your change.
2. Make and test your changes.
3. Commit with a clear message.
4. Open a pull request.

## License

Add the project's license here.
