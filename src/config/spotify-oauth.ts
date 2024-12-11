// import { registerAs } from "@nestjs/config";

// export default registerAs ('spotifyOauth', ()=>({
//     clientID: process.env.SPOTIFY_CLIENT,
//     clientSecret: process.env.SPOTIFY_SECRET,
//     callbackURI: process.env.SPOTIFY_CALLBACK,
// }))

// src/config/spotify-oauth.ts
import { registerAs } from '@nestjs/config';

export default registerAs('spotifyOauth', () => ({
  clientID: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  callbackURI: process.env.SPOTIFY_CALLBACK_URL,
}));
