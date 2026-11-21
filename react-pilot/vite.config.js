import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { copyFileSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
export default defineConfig({
  base: '/yaffo-stats/',
  plugins: [react(), {
    name: 'serve-unchanged-source-data',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const name = req.url?.split('?')[0].split('/').pop();
        if (!['games.json', 'fixtures.json'].includes(name)) return next();
        res.setHeader('Content-Type', 'application/json');
        res.end(readFileSync(resolve('..', name)));
      });
    },
    closeBundle() {
      for (const name of ['games.json', 'fixtures.json']) copyFileSync(resolve('..', name), resolve('dist', name));
    },
  }],
  publicDir: false,
  build: { rollupOptions: { input: resolve('pilot.html') } },
});
