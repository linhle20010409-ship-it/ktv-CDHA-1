import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    // Đảm bảo dấu gạch chéo ở đầu và cuối tên Repository
    base: '/ktv-CDHA-1/', 
    plugins: [react()],
    define: {
      'process.env': env
    },
    resolve: {
      alias: {
        // Giúp code tìm đúng thư mục src
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      outDir: 'dist', // Thư mục đầu ra khi build
    }
  };
});
