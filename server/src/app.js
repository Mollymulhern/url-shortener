import cors from 'cors';
import express from 'express';
import { LinkStore } from './link-store.js';

function parseHttpUrl(value) {
  if (typeof value !== 'string' || value.trim() === '') {
    return null;
  }

  try {
    const url = new URL(value.trim());
    return ['http:', 'https:'].includes(url.protocol) ? url.toString() : null;
  } catch {
    return null;
  }
}

export function createApp({
  store = new LinkStore(),
  baseUrl = process.env.BASE_URL,
  environment = process.env.NODE_ENV || 'development',
  allowedOrigins = (process.env.CORS_ORIGINS ?? (environment === 'development' ? 'http://localhost:5173' : '')).split(',').map((value) => value.trim()).filter(Boolean),
  rateLimit = 60,
  rateWindowMs = 60000,
  now = Date.now
} = {}) {
  if (!baseUrl && environment !== 'development' && environment !== 'test') {
    throw new Error('BASE_URL is required outside development.');
  }
  if (baseUrl) {
    const parsed = new URL(baseUrl);
    if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password ||
        parsed.pathname !== '/' || parsed.search || parsed.hash) {
      throw new Error('BASE_URL must be an HTTP(S) origin without credentials, path, query, or fragment.');
    }
    baseUrl = parsed.origin;
  }
  // One global window bounds limiter memory even with many distinct client addresses.
  let windowStart = now();
  let requests = 0;
  const app = express();

  app.disable('x-powered-by');
  app.use((request, response, next) => {
    const origin = request.get('origin');
    if (origin && origin !== baseUrl && !allowedOrigins.includes(origin)) {
      return response.status(403).json({ error: 'Origin is not allowed.' });
    }
    next();
  });
  app.use(cors({ origin: true }));
  app.use('/api/shorten', (request, response, next) => {
    if (request.method !== 'POST') return next();
    const time = now();
    if (time - windowStart >= rateWindowMs) {
      windowStart = time;
      requests = 0;
    }
    if (++requests > rateLimit) {
      response.set('Retry-After', String(Math.max(1, Math.ceil((rateWindowMs - (time - windowStart)) / 1000))));
      return response.status(429).json({ error: 'Too many requests. Please try again later.' });
    }
    next();
  });
  app.use(express.json({ limit: '16kb' }));

  app.get('/api/health', (_request, response) => {
    response.json({ status: 'ok' });
  });

  app.post('/api/shorten', (request, response) => {
    const originalUrl = parseHttpUrl(request.body?.url);

    if (!originalUrl) {
      return response.status(400).json({
        error: 'A valid HTTP or HTTPS URL is required.'
      });
    }

    const publicUrl = baseUrl || `${request.protocol}://${request.get('host')}`;
    const link = store.create(originalUrl, (code) => `${publicUrl}/${code}`);
    if (!link) return response.status(503).json({ error: 'Link capacity reached. Please try again later.' });
    return response.status(201).json(link);
  });

  app.get('/:code', (request, response) => {
    const link = store.get(request.params.code);

    if (!link) {
      return response.status(404).json({ error: 'Short link not found.' });
    }

    return response.redirect(302, link.originalUrl);
  });

  app.use((_request, response) => {
    response.status(404).json({ error: 'Route not found.' });
  });

  app.use((error, _request, response, _next) => {
    if (error instanceof SyntaxError && 'body' in error) {
      return response.status(400).json({ error: 'Request body must be valid JSON.' });
    }

    if (error.type === 'entity.too.large') {
      return response.status(413).json({ error: 'Request body is too large.' });
    }
    console.error(error);
    return response.status(500).json({ error: 'Internal server error.' });
  });

  return app;
}
