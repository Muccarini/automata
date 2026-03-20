import path from "path"
import { fileURLToPath } from "url"
import tailwindcss from "@tailwindcss/vite"
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 4387,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@automata/shared-contracts": path.resolve(__dirname, "../../packages/shared-contracts/src/index.ts"),
    },
  },
})
