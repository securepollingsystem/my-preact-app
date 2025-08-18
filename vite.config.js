import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import mkcert from 'vite-plugin-mkcert'

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [preact(), mkcert()],
	server: {
		port: 8990,
		allowedHosts: ['demo.securepollingsystem.org','demo.securepollingsystem.com']
	}
});
