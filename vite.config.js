import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          mantine: ['@mantine/core', '@mantine/hooks', '@mantine/notifications'],
          icons: ['@tabler/icons-react'],
          xlsx: ['xlsx'],
          vendor: ['react', 'react-dom', 'react-router-dom', 'papaparse', 'dayjs'],
        },
      },
    },
  },
});
