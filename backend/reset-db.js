import { unlink } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, 'classconnect.db');

unlink(dbPath, (err) => {
  if (err && err.code !== 'ENOENT') {
    console.error('Error deleting database:', err);
  } else {
    console.log('Database reset successfully. Restart the server to recreate tables.');
  }
});