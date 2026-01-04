import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
  define: {
    // 强制转换为字符串，防止 JSON.stringify(undefined) 导致的问题
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY || ''),
  },
});