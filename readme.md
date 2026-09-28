# URL Shortener

A small full-stack URL shortener built with React and Express. Create compact links, view recently created links, and follow a short code back to its original destination.

## Project Structure

```text
.
├── client/          # React application
├── server/          # Express API and link storage
├── tests/           # Live API contract tests
└── docs/API.md      # Endpoint reference
```

## Requirements

- Node.js 20.12 or newer
- npm

## Getting Started

1. Clone the repository and enter the project directory:

   ```bash
   git clone https://github.com/Mollymulhern/url-shortener.git
   cd url-shortener
   ```

2. Install both applications:

   ```bash
   npm run install:all
   ```

3. Create `server/.env` if you need to override local settings:

   ```env
   # server/.env
   PORT=5000
   BASE_URL=http://localhost:5000
   CORS_ORIGINS=http://localhost:5173
   ```

   Do not commit `.env` files or credentials.

4. Start the API:

   ```bash
   npm run dev:server
   ```

5. In a second terminal, start the UI:

   ```bash
   npm run dev:client
   ```

Open the local URL shown by the React development server in your browser.

## Commands

- `npm run build` — create the production frontend bundle.
- `npm test` — run backend, frontend, and integration tests.
- `npm run lint` — lint both applications.
- `npm run test:integration` — check a running API against its public contract.

The integration tests skip when no live API is configured. Start the backend, then run:

```bash
TEST_BASE_URL=http://localhost:5000 npm run test:integration
```

See [docs/API.md](docs/API.md) for endpoint details and examples.

## Contributing

Create a focused branch, include tests with behavior changes, and run the relevant checks before opening a pull request. Use concise imperative commit subjects, such as `Add custom link validation`. Include screenshots for visible UI changes.

## Deployment and storage

The server loads `server/.env` automatically; existing environment variables take precedence. See `server/.env.example`. Set `NODE_ENV=production` and `BASE_URL` to the public HTTPS origin serving redirects. Set `CORS_ORIGINS` to the exact frontend origin (comma-separated if needed). Configure your host to serve `client/dist` and proxy `/api` to the API, with short-code paths routed to the API.

Recent links are private to the browser profile and stored in localStorage (five maximum). There is no public listing endpoint. The API stores up to 10,000 links in memory, and accepts at most 60 creation attempts per minute globally per process. Links disappear on restart; use durable storage and shared limits before scaling. A full store rejects new links with 503 without removing existing redirects.
