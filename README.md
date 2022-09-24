# Cudi Zone

1. Server (nodejs) which loads torrents via web torrent client and streams them via http
2. Websocket server (nodejs and ws) to coordinate room state (ie video playback) for 2 participants
  - Room data stored in memory as the server will run on one VM due to anticipating a low load
  - in future if horizontal scaling is necessary a memory key value store database should be used 
  - to coordinate between servers
3. SQL database (postgres on Supabase) 
4. User accounts and authentication via Supabase Auth
5. Front end for adding and viewing friends powered right now by Supabase-js-client, to be
reworked into a server api on sveltekit

## Services
The following is the description of all the microservices that play a part in the application,
along with a textual description of their purposes and how they interconnect. All are standalone
NodeJs servers, deployed through a Docker image to a VM running on DigitalOcean.


### Website Serving Service
Runs the SvelteKit web framework, which is responsible for server-side rendering the web interface
and transmitting it to the client. SvelteKit was chosen due to its tight-knit integration with
the Svelte front-end framework.

The performance of the application could be improved by completely pre-rendering the web application,
and serving it via a global CDN, as nothing in the application is changed based on the user. User related changes
such as the username being displayed are hydrated client-side.

### Database Service
A Postgres database hosted by SupaBase. It is used to store the user accounts, along with the list of friends and friend
requests. CRUD operations on the database are performed through the SupaBase JavaScript client-side library - hence directly by the client.
The authentication through SupaBase is also done through their own APIs. 

There is a trade-off with the decision that the database access should be performed client-side. It simplifies the development required
as client authorisation and authentication can be handed off completely to SupaBase. It also does not require the creation
of separate REST APIs in order to add/remove/accept friends. But the downside is extra loading time for the client when they open the
application, as if the authorisation flow was performed sever side on the Website Server, a user could recieve a custom page.

### Torrent Broadcasting Service
Browsers of today do not support native connections to a torrent network such as BitTorrent, where the majority of 
torrent clients are still located. In order to allow a torrent to be streamed in a browser a middle-man server was needed.
It is a RESTful HTTP server which runs the WebTorrent library. A client is able to make a POST request to the server
containing the magnet URI of the torrent the client wishes to view. The serveer responds with a hash representing the torrent.
The client subsequently can make a get request to a resource at that hash and they will recieve a video stream through HTTP.

As a torrent video file is typically large, and it would be inconvenient to make the clients wait for the server to complete the
download, the torrent may be streamed before being ready. The WebTorrent library can create a ReadableStream from a torrent file,
prioritising the download of the chunks being requests. The client is able to specify the video segment desired, via standard
HTTP Headers for requesting a video file.

### WebSocket Messenger Service
The clients must be able to syncronise the playback of the video file. I.e. when the video is played or paused by any client,
when a video is seeked or when a new video file is requested. It is also desirable for such syncronisation to be performed
as equally as possible between the clients, to minimise the difference in the playback timing. Hence it is not desirable
to have one client act as a master. 

A WebSocket messenger server was created. It has a job of keeping track of the currently connected clients and rebroadcasting the
messege from one client to the client's partner. When a client connects to the server, it submits its user id via a query parameter
to the server. The server then labels this connection with the id. When a different client wishes to send this client a message
it provides the partner's message id to the server. The server is then able to find, among all open WebSockets, the correct client
and re-transmit the message appropriately.

The server is also responsible for informing a client upon connection if their partner is currently connected.

To minimise the playback time differential, a client will only begin playing once it recieves its own 'play' message back from the server
and not as soon as it sends the 'play' message.

### WebRCT Signalling Service
The Messenger server described above also serves as a WebRTC signalling server. WebRTC allows two or more clients to establish
a direct (peer-to-peer) connection, but before such a connection can be established, a session description must be exchanged
by the two clients. This necessitates a temporary signalling server. The existing WebSocket server was a perfect choice,
as it already allows one client to transmit a message to another client. Hence it can be used to perform a handshake in the following
order:
  1. Client A connects to WSS (WebSocket Server), is informed Client B is not online.
  2. Client B connects to WSS, is informed Client A is online.
  3. Because A is online, B generates a WebRTC session offer and transmits it to the WSS addressed to A.
  4. A recieves the offer and updates its own description, generates an anwser and sends it through WSS to B.
  5. B accepts the anwser and a peer connection is succesfully established.

During a WebRTC session, the clients keep seeking alternative connection paths known as ICE Candidates. Whenever one detects a
new appropriate ICE candidate, it transmits it to the partner also via the WSS.
