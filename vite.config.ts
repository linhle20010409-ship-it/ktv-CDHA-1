import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    // '/ktv-CDHA-1/' phải khớp chính xác với tên Repository của bạn
    base: '/ktv-CDHA-1/', 
    plugins: [react()],
    define: {
      'process.env': env
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      outDir: 'dist',
    }
  };
});
