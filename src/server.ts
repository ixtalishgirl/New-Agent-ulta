import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// Static frontend
app.use(express.static(path.resolve(__dirname, 'dist')));

// Dev API placeholders so the frontend is not blocked on missing tooling
app.get('/api/self/theme', (_req, res) => {
  res.json({
    bubbleUser: '#18181b',
    bubbleUserBorder: '#27272a',
    bubbleAgent: '#000000',
    accent: '#06b6d4',
  });
});

app.post('/api/self/theme', express.json(), (_req, res) => {
  res.json({ ok: true });
});

const port = Number(process.env.PORT) || 3000;
app.listen(port, '0.0.0.0', () => {
  console.log(`[Halye] dev server listening on http://0.0.0.0:${port}`);
});
