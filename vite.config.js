import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    // 本地开发时将 /api/* 转发到本地 API (端口 8788)
    // 启动方式：
    //   终端1: npm run dev:api
    //   终端2: npm run dev
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8788',
        changeOrigin: true,
      },
    },
  },
})
