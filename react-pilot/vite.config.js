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
        if (!['games.json', 'fixtures.json', 'league.json'].includes(name)) return next();
        res.setHeader('Content-Type', 'application/json');
        res.end(readFileSync(resolve('..', name)));
      });
    },
    closeBundle() {
      for (const name of ['games.json', 'fixtures.json', 'league.json']) copyFileSync(resolve('..', name), resolve('dist', name));
    },
  }],
  publicDir: false,
  build: { assetsDir: '', rollupOptions: { input: resolve('pilot.html'), output: { manualChunks(id) { if (id.includes('node_modules/react-dom') || id.includes('node_modules/scheduler')) return 'react-dom'; if (id.includes('node_modules/')) return 'vendor'; } } } },
});
