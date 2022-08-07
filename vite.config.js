import { sveltekit } from '@sveltejs/kit/vite';
import injectSocketIO from './server/socketIoHandler';

/** @type {import('vite').UserConfig} */
const config = {
  server: {
      port: 5173
    },
    preview: {
      port: 5173
    },
	plugins: [sveltekit(), webSocketServer],
};

export default config;


export const webSocketServer = {
    name: 'webSocketServer',
    configureServer(server) {
        injectSocketIO(server.httpServer);
    }
};
