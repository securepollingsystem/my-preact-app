import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [preact()],
	server: {
		port: 8990,
		allowedHosts: ['demo.securepollingsystem.org','demo.securepollingsystem.com']
	}
});
