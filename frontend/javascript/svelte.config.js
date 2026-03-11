import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://svelte.dev/docs/kit/integrations
	// for more information about preprocessors
	preprocess: vitePreprocess(),
	kit: {
		// Static adapter for SPA mode
		adapter: adapter({
			pages: '../system/var/capy/www',
			assets: '../system/var/capy/www',
			fallback: 'index.html' // SPA mode - all routes fallback to index.html
		}),
		prerender: {
			handleHttpError: 'warn'
		}
	}
};

export default config;
