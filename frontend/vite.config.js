import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'https://sms-rpo.onrender.com',
      '/webhook': 'https://sms-rpo.onrender.com',
      '/socket.io': {
        target: 'https://sms-rpo.onrender.com',
        ws: true,
        changeOrigin: true,
      },
    },
  },
});
