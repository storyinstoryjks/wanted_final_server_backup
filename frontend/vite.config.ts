import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
import tailwindcss from 'tailwindcss';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '~': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5174,
    host: true, // Gitpod 환경에서 서버 접속을 위해 필요
    allowedHosts: ['5174-storyinstoryj-wantedcat-1h9np3sscvm.ws-us121.gitpod.io'],
    proxy: {
      '/api': { 
        target: 'https://8080-storyinstoryj-wantedcat-1h9np3sscvm.ws-us121.gitpod.io', 
        changeOrigin: true, 
        secure:true
      },
      // 추가-jks: FastAPI(collectionservice, 8000)
      '/collection': {
        target: 'http://collectionservice:8000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/collection/, ''), // '/collection' 제거
      },
      // 추가-jks: FastAPI(aiservice, 8001)
      '/ai': {
        target: 'http://aiservice:8001',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/ai/, ''), // '/collection' 제거
      },
      '/hls': {
        target: 'https://8555-sjleecatthe-wantedcat-7dxfzhg0f8g.ws-us121.gitpod.io',   // MediaMTX HLS 원본(같은 호스트에서 8555)
        changeOrigin: true,
        secure: false,
        rewrite: (path: string) => path.replace(/^\/hls/, ''), // /hls → /
      },
    },
  
  },
  css:{
    postcss:{
      plugins: [tailwindcss()],
    }
  }
});