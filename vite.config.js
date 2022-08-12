import { sveltekit } from '@sveltejs/kit/vite';

/** @type {import('vite').UserConfig} */
const config = {
  server: {
      port: 5173
    },
    preview: {
      port: 5173
    },
	plugins: [sveltekit()],
};

export default config;
