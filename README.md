# Cudi Zone

A web application to enable two people to stream a torrent together with synchronised playback while participating in a
video chat. It consists of a server downloading a torrent file and streaming it to the clients, and a WebSocket messaging
server to allow the playback synchronisation and WebRTC signalling. It is deployed on a virtual machine on DigitalOcean.

Tools used:
- Svelte
- SvelteKit
- Express
- WebTorrent
- WebRTC
- Supabase (PostgreSQL host)

