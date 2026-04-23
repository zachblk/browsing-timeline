import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    // Opens your default browser as soon as the dev server is ready (no manual URL).
    open: true,
  },
})
