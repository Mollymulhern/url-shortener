import { loadEnvFile } from 'node:process';
import { fileURLToPath } from 'node:url';
import { createApp } from './app.js';

try {
  loadEnvFile(fileURLToPath(new URL('../.env', import.meta.url)));
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}

const port = Number(process.env.PORT ?? '5000');
if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error('Invalid PORT');
const app = createApp();
app.listen(port, () => {
  console.log(`URL shortener API listening on http://localhost:${port}`);
});
