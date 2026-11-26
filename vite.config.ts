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
  plugins: [react(), localStudySyncPlugin()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
});
