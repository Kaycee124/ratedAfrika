// // src/auth/spotify.strategy.ts

// import { Inject, Injectable } from '@nestjs/common';
// import { PassportStrategy } from '@nestjs/passport';
// import { Strategy, Profile, VerifyCallback } from 'passport-spotify';
// import { AuthService } from '../auth.service';
// import * as dotenv from 'dotenv';
// import spotifyOauth from 'src/config/spotify-oauth';
// import { ConfigType } from '@nestjs/config';

// dotenv.config();

// @Injectable()
// export class SpotifyStrategy extends PassportStrategy(Strategy, 'spotify') {
//   constructor(
//     @Inject(spotifyOauth.KEY)
//     private spotifyConfig: ConfigType<typeof spotifyOauth>,
//     private authService: AuthService,
//   ) {
//     super({
//       clientID: spotifyConfig.clientID,
//       clientSecret: spotifyConfig.clientSecret, // Spotify Client Secret
//       callbackURL: spotifyConfig.callbackURI, // Callback URL
//       scope: ['user-read-email', 'user-read-private'],
//     });
//   }

//   async validate(
//     accessToken: string,
//     refreshToken: string,
//     expires_in: number,
//     profile: Profile,
//     done: VerifyCallback,
//   ): Promise<any> {
//     console.log(profile);
//     // try {
//     //   const user = await this.authService.validateSpotifyUser(profile, accessToken);
//     //   done(null, user);
//     // } catch (err) {
//     //   done(err, false);
//     // }
//   }
// }

// src/auth/strategies/spotify-strategy.ts
import { Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-spotify';
import spotifyOauth from 'src/config/spotify-oauth';
import { AuthService } from '../auth.service';
// import { RegisterUserDto } from '../dto/register.dto';

@Injectable()
export class SpotifyStrategy extends PassportStrategy(Strategy, 'spotify') {
  constructor(
    @Inject(spotifyOauth.KEY)
    private readonly spotifyConfig: ConfigType<typeof spotifyOauth>,
    private readonly authService: AuthService,
  ) {
    super({
      clientID: spotifyConfig.clientID,
      clientSecret: spotifyConfig.clientSecret,
      callbackURL: spotifyConfig.callbackURI,
      scope: ['user-read-email', 'user-read-private'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
    done: Function,
  ) {
    try {
      const user = await this.authService.validateSpotifyUser(profile);

      // Return user with OAuth tokens for session management
      return done(null, {
        user,
        accessToken,
        refreshToken,
      });
    } catch (error) {
      return done(error, false);
    }
  }
}
