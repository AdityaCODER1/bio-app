import { defineConfig, type Plugin } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { createLocalStudySyncMiddleware } from './server/localStudySync';

function localStudySyncPlugin(): Plugin {
  const middleware = createLocalStudySyncMiddleware(__dirname);
  return {
    name: 'local-study-sync',
    configureServer(server) {
      server.middlewares.use(middleware);
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware);
    },
  };
}

export default defineConfig({
  base: process.env.VITE_BASE_PATH ?? (process.env.GITHUB_ACTIONS ? '/bio-app/' : '/'),
  plugins: [react(), localStudySyncPlugin()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
});
