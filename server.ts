import express, { NextFunction, Request, Response } from 'express';
import http from 'node:http';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { INITIAL_PUZZLES } from './src/data/puzzles.ts';

async function startServer() {
  const app = express();
  const PORT = 3000;
  const httpServer = http.createServer(app);

  app.use(express.json());

  // Clickjacking / MIME-sniffing controls. GitHub Pages cannot set these;
  // they apply to `npm start` and local Express. frame-ancestors is header-only
  // (the index.html meta CSP cannot enforce it).
  app.use((_req: Request, res: Response, next: NextFunction) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Content-Security-Policy', "frame-ancestors 'none'");
    next();
  });

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', puzzlesCount: INITIAL_PUZZLES.length });
  });

  app.use((req, _res, next) => {
    const url = req.path;
    if (url === '/splash' || url === '/splash.html' || url === '/splashdev' || url === '/splashdev.html') {
      req.url = '/index.html';
    }
    next();
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: { server: httpServer } },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    console.error('[server]', err);
    if (res.headersSent) return;
    res.status(500).json({ error: 'Desk jammed' });
  });

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Chronicle Cryptogram server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[server] failed to start', err);
  process.exit(1);
});
