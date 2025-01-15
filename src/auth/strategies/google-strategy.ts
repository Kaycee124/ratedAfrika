import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { googleOAuthConfig } from 'src/config/google-oauth.config';
import { AuthService } from '../auth.service';
import { RegisterUserDto } from '../dto/register.dto';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(GoogleStrategy.name);

  constructor(
    @Inject(googleOAuthConfig.KEY)
    private googleConfig: ConfigType<typeof googleOAuthConfig>,
    private authService: AuthService,
  ) {
    super({
      clientID: googleConfig.clientID,
      clientSecret: googleConfig.clientSecret,
      callbackURL: googleConfig.callbackURL,
      scope: ['email', 'profile'],
    });

    this.logger.log(
      `Initialized Google OAuth with callback URL: ${googleConfig.callbackURL}`,
    );
  }

  async validate(
    access_token: string,
    refresh_Token: string,
    profile: any,
    done: VerifyCallback,
  ) {
    try {
      const { id, name, emails, photos } = profile;
      const email = emails[0].value;
      const _name = name.familyName;
      const displayPic = photos[0]?.value;

      const googleUser: RegisterUserDto = {
        email: email,
        name: _name,
        profileImage: displayPic,
        googleID: id,
        password: '',
        password_confirm: '',
      };

      const user = await this.authService.validateGoogleUser(googleUser);
      return done(null, user);
    } catch (error) {
      this.logger.error('Google validation failed:', error);
      return done(error, false);
    }
  }
}

// // src/auth/strategies/google-strategy.ts
// import { Inject, Injectable } from '@nestjs/common';
// import { ConfigType } from '@nestjs/config';
// import { PassportStrategy } from '@nestjs/passport';
// import { Strategy, VerifyCallback } from 'passport-google-oauth20';
// import { googleOAuthConfig } from 'src/config/google-oauth.config';
// import { AuthService } from '../auth.service';
// import { RegisterUserDto } from '../dto/register.dto';

// @Injectable()
// export class GoogleStrategy extends PassportStrategy(Strategy) {
//   constructor(
//     @Inject(googleOAuthConfig.KEY)
//     private googleConfig: ConfigType<typeof googleOAuthConfig>,
//     private authservice: AuthService,
//   ) {
//     super({
//       clientID: googleConfig.clientID,
//       clientSecret: googleConfig.clientSecret,
//       callbackURL: googleConfig.callbackURL,
//       scope: ['email', 'profile'],
//     });
//   }

//   async validate(
//     access_token: string,
//     refresh_Token: string,
//     profile: any,
//     done: VerifyCallback,
//   ) {
//     try {
//       console.log(profile);
//       const { id, name, emails, photos } = profile;
//       const email = emails[0].value;
//       const _name = name.familyName;
//       const displayPic = photos[0].value;

//       const googleUser: RegisterUserDto = {
//         email: email,
//         name: _name,
//         profileImage: displayPic,
//         googleID: id,
//         password: '',
//         password_confirm: '',
//       };

//       const user = await this.authservice.validateGoogleUser(googleUser);
//       return done(null, user);
//     } catch (error) {
//       return done(error, false);
//     }
//   }
// }
