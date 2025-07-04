import { serve } from '@hono/node-server';
import app from './routes';

// Set port from environment variable or default to 3000
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

console.log(`Starting server on port ${PORT}...`);
serve({
  fetch: app.fetch,
  port: PORT
});

console.log(`Server running at http://localhost:${PORT}`);