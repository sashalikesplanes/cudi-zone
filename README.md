# Cudi Zone

1. Server (nodejs) which loads torrents via web torrent client and streams them via http
2. Websocket server (nodejs and ws) to coordinate room state (ie video playback) for 2 participants
3. SQL database (postgres on Supabase) 
4. User accounts and authentication via Supabase Auth
5. Front end for adding and viewing friends powered right now by Supabase-js-client, to be
reworked into a server api on sveltekit
