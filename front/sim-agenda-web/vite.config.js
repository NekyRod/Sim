import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
    tailwindcss(),
  ],
  server: {
    host: '0.0.0.0', // Permite conexiones desde Docker
    port: 5173,
    strictPort: true, // Falla si el puerto está ocupado en vez de saltar al 5174...
    watch: {
      usePolling: true,
    },
    hmr: {
      clientPort: 80, // Dile al navegador que busque el WebSocket en el puerto expuesto del Host (80)
    }
  },
})
