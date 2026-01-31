import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // ĐÂY LÀ DÒNG QUAN TRỌNG NHẤT
  // Nó giúp web tìm đúng file trong thư mục dự án của bạn
  base: "/ktv-CDHA-1/",
})
