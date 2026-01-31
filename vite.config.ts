import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/ktv-CDHA-1/', // Sửa lỗi 404 cho GitHub Pages
  plugins: [react()],
});
