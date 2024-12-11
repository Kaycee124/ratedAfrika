// import { registerAs } from '@nestjs/config';

// export default registerAs('googleOauth', () => ({
//   clientID: process.env.GOOGLE_CLIENT,
//   clientSecret: process.env.GOOGLE_SECRET,
//   callbackURI: process.env.GOOGLE_CALLBACK,
// }));

// src/config/google-oauth.config.ts
import { registerAs } from '@nestjs/config';

export const googleOAuthConfig = registerAs('google', () => ({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL,
  scope: ['email', 'profile'],
}));
