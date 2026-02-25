/**
 * Vite plugin: handle OpenAI Images API proxy in-dev so the frontend works with only `npm run dev`.
 * Reads OPENAI_API_KEY from .env (no separate Netlify/backend needed for image generation).
 */
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '.env') });

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY || '';
const OPENAI_ORG_ID = process.env.OPENAI_ORG_ID || '';
const IMAGES_URL = 'https://api.openai.com/v1/images/generations';

export default function viteOpenaiImages() {
  return {
    name: 'vite-openai-images',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const path = req.url?.split('?')[0] || '';
        if (req.method !== 'POST' || !path.endsWith('openai-images')) {
          return next();
        }

        if (!OPENAI_API_KEY) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.end(JSON.stringify({
            error: 'Image generation not configured. Add OPENAI_API_KEY or VITE_OPENAI_API_KEY to .env in project root.'
          }));
          return;
        }

        let body = '';
        req.on('data', (chunk) => { body += chunk; });
        req.on('end', async () => {
          try {
            const headers = {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${OPENAI_API_KEY}`
            };
            if (OPENAI_ORG_ID) headers['OpenAI-Organization'] = OPENAI_ORG_ID;

            const openaiRes = await fetch(IMAGES_URL, {
              method: 'POST',
              headers,
              body: body || '{}'
            });
            const text = await openaiRes.text();
            res.statusCode = openaiRes.status;
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.end(text);
          } catch (err) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.end(JSON.stringify({ error: err.message || 'Proxy error' }));
          }
        });
      });
    }
  };
}
