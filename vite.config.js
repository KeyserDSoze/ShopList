import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

const PUBLIC_GOOGLE_CLIENT_ID = '389226084784-096gc46urokrklbc068f6dk9t2t6rql3.apps.googleusercontent.com'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const clientId = env.VITE_GOOGLE_CLIENT_ID || PUBLIC_GOOGLE_CLIENT_ID
  return {
    plugins: [react()],
    base: '/ShopList/',
    define: {
      // Client ID is NOT a secret: it's public by design in OAuth2 for web apps.
      // Security is enforced via Authorized redirect URIs in Google Cloud Console.
      'import.meta.env.VITE_GOOGLE_CLIENT_ID': JSON.stringify(clientId),
    },
  }
})
