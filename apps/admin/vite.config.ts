import { defineConfig } from 'vite';

export default defineConfig({
  base: '/admin/',
  build: {
    rollupOptions: {
      external: [/^firebase(\/.*)?$/],
    },
  },
});

