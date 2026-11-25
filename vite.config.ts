import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Runs the files in /api during `npm run dev`, the same way Vercel runs them in production.
 *
 * Each file in /api exports one function per HTTP method, e.g. `export async function POST(request)`.
 * The function takes a standard web Request and returns a standard web Response, so the same code
 * works here and on Vercel without changes. Files in /api/_lib are helpers, not endpoints.
 */
function devApi(): Plugin {
  return {
    name: 'release-night-dev-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);
        const match = /^\/api\/([a-z0-9-]+)$/.exec(url.pathname);
        if (!match) return next();

        const file = resolve(server.config.root, 'api', `${match[1]}.ts`);
        if (!existsSync(file)) {
          res.statusCode = 404;
          res.setHeader('content-type', 'application/json');
          return res.end(JSON.stringify({ error: 'Not found' }));
        }

        try {
          const mod = await server.ssrLoadModule(file);
          const method = (req.method ?? 'GET').toUpperCase();
          const handler = mod[method] as ((request: Request) => Promise<Response> | Response) | undefined;
          if (!handler) {
            res.statusCode = 405;
            res.setHeader('content-type', 'application/json');
            return res.end(JSON.stringify({ error: 'Method not allowed' }));
          }

          const chunks: Buffer[] = [];
          for await (const chunk of req) chunks.push(chunk as Buffer);
          const headers = new Headers();
          for (const [key, value] of Object.entries(req.headers)) {
            if (Array.isArray(value)) value.forEach((v) => headers.append(key, v));
            else if (value !== undefined) headers.set(key, value);
          }
          const hasBody = method !== 'GET' && method !== 'HEAD' && chunks.length > 0;
          const request = new Request(url, { method, headers, body: hasBody ? Buffer.concat(chunks) : undefined });

          const response = await handler(request);
          res.statusCode = response.status;
          response.headers.forEach((value, key) => {
            if (key !== 'set-cookie') res.setHeader(key, value);
          });
          const cookies = response.headers.getSetCookie();
          if (cookies.length) res.setHeader('set-cookie', cookies);
          res.end(Buffer.from(await response.arrayBuffer()));
        } catch (error) {
          server.ssrFixStacktrace(error as Error);
          next(error);
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), devApi()],
});
