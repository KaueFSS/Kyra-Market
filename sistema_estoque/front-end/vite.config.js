import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // host: true → escuta em todas as interfaces de rede (0.0.0.0).
    // Necessário para que outras máquinas (Radmin VPN, LAN) acessem o frontend.
    host: true,
    port: 5173,
    strictPort: true,
  },
})
