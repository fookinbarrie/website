import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('reactflow')) return 'vendor-reactflow';
            if (id.includes('@blocknote')) return 'vendor-blocknote';
            if (id.includes('react') || id.includes('react-dom')) return 'vendor-react';
            return 'vendor-others';
          }
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
})