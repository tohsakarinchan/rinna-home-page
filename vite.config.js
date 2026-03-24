import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    // 本地开发时将 /api/* 转发到 wrangler pages dev (端口 8788)
    // 启动方式：
    //   终端1: wrangler pages dev ./dist --port 8788
    //   终端2: npm run dev
    proxy: {
      '/api': {
        target: 'http://localhost:8788',
        changeOrigin: true,
      },
    },
  },
})
