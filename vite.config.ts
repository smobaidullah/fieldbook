import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Served from https://smobaidullah.github.io/fieldbook/
export default defineConfig({
  plugins: [react()],
  base: '/fieldbook/',
})
