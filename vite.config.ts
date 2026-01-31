import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // DÒNG QUAN TRỌNG NHẤT: Khai báo tên Repository của bạn
  // Dựa trên link web của bạn là .../ktv-CDHA-1/
  base: "/ktv-CDHA-1/",
  build: {
    outDir: 'dist',
  },
});
