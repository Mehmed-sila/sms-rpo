import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'https://sms-rpo-production.up.railway.app',
      '/webhook': 'https://sms-rpo-production.up.railway.app',
      '/socket.io': {
        target: 'https://sms-rpo-production.up.railway.app',
        ws: true,
        changeOrigin: true,
      },
    },
  },
});
