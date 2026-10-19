import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Expõe o dev server na rede local (permite acesso pelo celular).
    host: true,
    port: 5173,
    // Encaminha /api para o backend, evitando CORS e funcionando em qualquer
    // dispositivo (celular acessa o Vite, que repassa para o backend local).
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
