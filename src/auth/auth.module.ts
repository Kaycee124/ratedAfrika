import { Module, forwardRef, Global } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from 'src/users/users.module';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';
import { GoogleStrategy } from './strategies/google-strategy';
import { SpotifyStrategy } from './strategies/spotify-strategy';
import { ConfigModule } from '@nestjs/config';
import { googleOAuthConfig } from 'src/config/google-oauth.config';
import spotifyOauth from 'src/config/spotify-oauth';
// import { SharedModule } from 'src/core/shared/shared.module';

// Note: Following items have been moved to infrastructure:

// Moved to DatabaseModule:
// - TypeOrmModule and all entity imports
// - Database connection configuration

// Moved to SharedModule:
// - JwtModule configuration
// - TokenService
// - EmailService
// - OtpService
// - JwtAuthGuard
// - All repositories (User, PasswordReset, EmailVerification)

// Moved to SharedModule (Mailer Section):
// - MailerModule configuration
// - Mailer templates configuration
// - Email-related utilities

@Global()
@Module({
  imports: [
    forwardRef(() => UsersModule),
    // SharedModule,
    PassportModule.register({
      defaultStrategy: 'jwt',
    }),
    ConfigModule.forFeature(googleOAuthConfig),
    ConfigModule.forFeature(spotifyOauth),
  ],
  providers: [AuthService, JwtStrategy, GoogleStrategy, SpotifyStrategy],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
// import { Module, forwardRef } from '@nestjs/common';
// import { AuthService } from './auth.service';
// import { AuthController } from './auth.controller';
// import { UsersModule } from 'src/users/users.module';
// import { JwtModule, JwtService } from '@nestjs/jwt';
// import { PassportModule } from '@nestjs/passport';
// import * as dotenv from 'dotenv';
// import { JwtStrategy } from './jwt.strategy';
// import { ConfigModule, ConfigService } from '@nestjs/config';
// import googleOauth from 'src/config/google-oauth';
// import { GoogleStrategy } from './strategies/google-strategy';
// import spotifyOauth from 'src/config/spotify-oauth';
// import { TypeOrmModule } from '@nestjs/typeorm';
// import { User } from 'src/users/user.entity';
// import { PasswordReset } from 'src/users/Entities/password-reset-token.entity';
// import { EmailVerificationToken } from 'src/users/Entities/email-verification.entity';
// import { SpotifyStrategy } from './strategies/spotify-strategy';
// import { MailerModule } from '@nestjs-modules/mailer';
// import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
// import { TokenService } from './services/token.service';
// import { EmailService } from './services/email.service';
// import { UserRepository } from './repositories/user.repository';
// import { PasswordResetRepository } from './repositories/password-reset-token.repository';
// import { EmailVerificationTokenRepository } from './repositories/email-verification-token.repository';
// import { OtpService } from './services/otp.service';
// import { Otp } from 'src/users/Entities/otp.entity';
// import { JwtAuthGuard } from './guards/jwt/jwt.guard';

// dotenv.config();

// @Module({
//   imports: [
//     forwardRef(() => UsersModule),
//     ConfigModule.forRoot(),
//     PassportModule.register({ defaultStrategy: 'jwt' }),
//     TypeOrmModule.forFeature([
//       User,
//       PasswordReset,
//       EmailVerificationToken,
//       Otp,
//       PasswordResetRepository,
//     ]),
//     // JwtModule.registerAsync({
//     //   imports: [ConfigModule],
//     //   inject: [ConfigService],
//     //   useFactory: async (configService: ConfigService) => ({
//     //     secret: configService.get<string>('JWT_SECRET'),
//     //     signOptions: {
//     //       expiresIn: '1h',
//     //     },
//     //   }),
//     // }),
//     JwtModule.registerAsync({
//       imports: [ConfigModule],
//       inject: [ConfigService],
//       useFactory: async (configService: ConfigService) => {
//         const secret = configService.get<string>('JWT_SECRET');

//         // Add validation
//         if (!secret) {
//           throw new Error('JWT_SECRET is not defined in environment variables');
//         }

//         console.log('JWT_SECRET loaded:', !!secret); // Debug log

//         return {
//           secret,
//           signOptions: {
//             expiresIn: '1h',
//           },
//         };
//       },
//     }),
//     ConfigModule.forFeature(googleOauth),
//     ConfigModule.forFeature(spotifyOauth),
//     // can remove
//     MailerModule.forRootAsync({
//       imports: [ConfigModule], // Import ConfigModule to access environment variables
//       inject: [ConfigService],
//       useFactory: async (configService: ConfigService) => ({
//         transport: {
//           host: configService.get<string>('EMAIL_HOST'),
//           port: configService.get<number>('EMAIL_PORT'),
//           secure: configService.get<boolean>('MAILER_SECURE'), // true for 465, false for other ports
//           auth: {
//             user: configService.get<string>('EMAIL_USER'),
//             pass: configService.get<string>('EMAIL_PASS'),
//           },
//         },
//         defaults: {
//           from: `"No Reply" <${configService.get<string>('MAILER_FROM')}>`,
//         },
//         template: {
//           dir: __dirname + '/templates', // Path to your templates folder
//           adapter: new HandlebarsAdapter(), // Use Handlebars adapter
//           options: {
//             strict: true,
//           },
//           //TODO REMOVE in production
//           //remove in production
//         },
//       }),
//     }),
//     // end of it
//   ],
//   providers: [
//     AuthService,
//     JwtStrategy,
//     GoogleStrategy,
//     SpotifyStrategy,
//     TokenService,
//     EmailService,
//     UserRepository,
//     PasswordResetRepository,
//     EmailVerificationTokenRepository,
//     OtpService,
//     JwtAuthGuard,
//     JwtModule,
//     JwtService,
//   ],
//   controllers: [AuthController],
//   exports: [
//     JwtAuthGuard,
//     TokenService,
//     JwtModule,
//     // JwtService,
//     // JwtStrategy,
//     // AuthService,
//     // EmailService,
//     // OtpService,
//     AuthModule,
//   ],
// })
// export class AuthModule {}

// import { Module } from '@nestjs/common';
// import { TypeOrmModule } from '@nestjs/typeorm';
// import { JwtModule } from '@nestjs/jwt';
// import { ConfigModule, ConfigService } from '@nestjs/config';
// import { PassportModule } from '@nestjs/passport';

// // Services
// import { TokenService } from './services/token.service';
// import { AuthService } from './auth.service';
// import { EmailService } from './services/email.service';
// import { OtpService } from './services/otp.service';

// // Repositories and Entities
// import { User } from '../users/user.entity';
// import { PasswordReset } from '../users/Entities/password-reset-token.entity';
// import { EmailVerificationToken } from '../users/Entities/email-verification.entity';
// import { Otp } from '../users/Entities/otp.entity';
// import { UserRepository } from './repositories/user.repository';
// import { PasswordResetRepository } from './repositories/password-reset-token.repository';
// import { EmailVerificationTokenRepository } from './repositories/email-verification-token.repository';

// // Strategies
// import { JwtStrategy } from './jwt.strategy';
// import { GoogleStrategy } from './strategies/google-strategy';
// import { SpotifyStrategy } from './strategies/spotify-strategy';

// // Controllers
// import { AuthController } from './auth.controller';
// import { UsersModule } from 'src/users/users.module';
// import { MailerModule } from '@nestjs-modules/mailer';
// import { join } from 'path';

// @Module({
//   imports: [
//     UsersModule,
//     ConfigModule,

//     // JWT Configuration
//     JwtModule.registerAsync({
//       imports: [ConfigModule],
//       inject: [ConfigService],
//       useFactory: async (configService: ConfigService) => ({
//         secret: configService.get<string>('JWT_SECRET'),
//         signOptions: {
//           expiresIn: configService.get<string>('JWT_EXPIRATION', '1h'),
//         },
//       }),
//     }),

//     // Mailer Configuration
//     MailerModule.forRootAsync({
//       imports: [ConfigModule],
//       inject: [ConfigService],
//       useFactory: async (configService: ConfigService) => ({
//         transport: {
//           host: configService.get('MAIL_HOST'),
//           port: configService.get('MAIL_PORT'),
//           secure: configService.get('MAIL_SECURE', false),
//           auth: {
//             user: configService.get('MAIL_USER'),
//             pass: configService.get('MAIL_PASSWORD'),
//           },
//         },
//         defaults: {
//           from: `"${configService.get('MAIL_FROM_NAME')}" <${configService.get('MAIL_FROM_ADDRESS')}>`,
//         },
//         template: {
//           dir: join(__dirname, 'templates'),
//           adapter: new HandlebarsAdapter(),
//           options: {
//             strict: true,
//           },
//         },
//       }),
//     }),
//   ],
//   controllers: [AuthController],
//   providers: [
//     // Services
//     AuthService,
//     TokenService,
//     EmailService,
//     OtpService,

//     // Strategies
//     JwtStrategy,
//     GoogleStrategy,
//     SpotifyStrategy,

//     // Repositories
//     UserRepository,
//     PasswordResetRepository,
//     EmailVerificationTokenRepository,
//   ],
//   exports: [TokenService, AuthService, JwtStrategy, PassportModule, JwtModule],
// })
// export class AuthModule {}

// import { Module } from '@nestjs/common';
// import { TypeOrmModule } from '@nestjs/typeorm';
// import { JwtModule } from '@nestjs/jwt';
// import { ConfigModule, ConfigService } from '@nestjs/config';
// import { PassportModule } from '@nestjs/passport';
// import { MailerModule } from '@nestjs-modules/mailer';
// import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
// import { join } from 'path';
// import * as dotenv from 'dotenv';

// // Controllers
// import { AuthController } from './auth.controller';

// // Services
// import { AuthService } from './auth.service';
// import { TokenService } from './services/token.service';
// import { EmailService } from './services/email.service';
// import { OtpService } from './services/otp.service';
// import { UsersModule } from 'src/users/users.module';
// // Strategies
// import { JwtStrategy } from './jwt.strategy';
// import { GoogleStrategy } from './strategies/google-strategy';
// import { SpotifyStrategy } from './strategies/spotify-strategy';

// // Guards
// import { JwtAuthGuard } from './guards/jwt/jwt.guard';

// // Entities
// import { User } from 'src/users/user.entity';
// import { PasswordReset } from 'src/users/Entities/password-reset-token.entity';
// import { EmailVerificationToken } from 'src/users/Entities/email-verification.entity';
// import { Otp } from 'src/users/Entities/otp.entity';

// // Repositories
// import { UserRepository } from './repositories/user.repository';
// import { PasswordResetRepository } from './repositories/password-reset-token.repository';
// import { EmailVerificationTokenRepository } from './repositories/email-verification-token.repository';

// // Config imports
// import googleOauth from 'src/config/google-oauth';
// import spotifyOauth from 'src/config/spotify-oauth';

// dotenv.config();

// @Module({
//   imports: [
//     // Core modules
//     UsersModule,
//     ConfigModule,

//     // Passport configuration
//     PassportModule.register({
//       defaultStrategy: 'jwt',
//       property: 'user',
//       session: false,
//     }),

//     // TypeORM Entity configuration
//     TypeOrmModule.forFeature([
//       User,
//       PasswordReset,
//       EmailVerificationToken,
//       PasswordResetRepository,
//       Otp,
//     ]),

//     // JWT Configuration
//     JwtModule.registerAsync({
//       imports: [ConfigModule],
//       inject: [ConfigService],
//       useFactory: async (configService: ConfigService) => ({
//         secret: configService.get<string>('JWT_SECRET'),
//         signOptions: {
//           expiresIn: configService.get<string>('JWT_EXPIRATION', '1h'),
//           algorithm: 'HS256',
//         },
//         verifyOptions: {
//           algorithms: ['HS256'],
//         },
//       }),
//     }),

//     // OAuth Configurations
//     ConfigModule.forFeature(googleOauth),
//     ConfigModule.forFeature(spotifyOauth),

//     // Mailer Configuration
//     MailerModule.forRootAsync({
//       imports: [ConfigModule],
//       inject: [ConfigService],
//       useFactory: async (configService: ConfigService) => ({
//         transport: {
//           host: configService.get<string>('EMAIL_HOST'),
//           port: configService.get<number>('EMAIL_PORT'),
//           secure: configService.get<boolean>('MAILER_SECURE'),
//           auth: {
//             user: configService.get<string>('EMAIL_USER'),
//             pass: configService.get<string>('EMAIL_PASS'),
//           },
//           // Add timeout and retry settings
//           connectionTimeout: 10000,
//           greetingTimeout: 10000,
//           socketTimeout: 10000,
//           pool: true,
//           maxConnections: 5,
//           maxMessages: 100,
//           // Add TLS options
//           tls: {
//             rejectUnauthorized: process.env.NODE_ENV === 'production',
//             ciphers: 'SSLv3',
//           },
//         },
//         defaults: {
//           from: `"${configService.get<string>('MAILER_FROM_NAME', 'No Reply')}" <${configService.get<string>('MAILER_FROM')}>`,
//         },
//         template: {
//           dir: join(__dirname, 'templates'),
//           adapter: new HandlebarsAdapter(),
//           options: {
//             strict: true,
//           },
//         },
//         // Enable preview only in development
//         preview: process.env.NODE_ENV !== 'production',
//       }),
//     }),
//   ],

//   // Register providers
//   providers: [
//     // Core services
//     AuthService,
//     TokenService,
//     EmailService,
//     OtpService,

//     // Authentication strategies
//     JwtStrategy,
//     GoogleStrategy,
//     SpotifyStrategy,

//     // Repositories
//     UserRepository,
//     PasswordResetRepository,
//     EmailVerificationTokenRepository,

//     // Guards
//     JwtAuthGuard,

//     // Additional modules
//     JwtModule,
//   ],

//   // Register controllers
//   controllers: [AuthController],

//   // Export necessary services and guards
//   exports: [JwtAuthGuard, TokenService, JwtModule, AuthService, PassportModule],
// })
// export class AuthModule {}
