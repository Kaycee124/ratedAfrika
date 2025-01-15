// // src/infrastructure/shared/shared.module.ts
// import { Global, Module } from '@nestjs/common';
// import { JwtModule, JwtService } from '@nestjs/jwt';
// import { ConfigModule, ConfigService } from '@nestjs/config';
// import { TokenService } from 'src/auth/services/token.service';
// import { EmailService } from 'src/auth/services/email.service';
// import { DatabaseModule } from '../database/database.module';
// import { JwtAuthGuard } from 'src/auth/guards/jwt/jwt.guard';

// @Global()
// @Module({
//   imports: [
//     DatabaseModule,
//     JwtModule.registerAsync({
//       imports: [ConfigModule],
//       inject: [ConfigService],
//       useFactory: (configService: ConfigService) => ({
//         secret: configService.get('JWT_SECRET'),
//         signOptions: {
//           expiresIn: configService.get('JWT_EXPIRATION', '1h'),
//         },
//       }),
//     }),
//   ],
//   providers: [
//     TokenService,
//     EmailService,
//     {
//       provide: 'JwtAuthGuard',
//       useFactory: (tokenService, jwtService, configService) => {
//         return new JwtAuthGuard(tokenService, jwtService, configService);
//       },
//       inject: [TokenService, JwtService, ConfigService],
//     },
//   ],
//   exports: [JwtModule, TokenService, EmailService, 'JwtAuthGuard'],
// })
// export class SharedModule {}

// src/infrastructure/shared/shared.module.ts
import { Global, Module } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { join } from 'path';
import { DatabaseModule } from '../database/database.module';

// Services
import { TokenService } from '../../auth/services/token.service';
import { EmailService } from '../../auth/services/email.service';
import { OtpService } from '../../auth/services/otp.service';
import { JwtAuthGuard } from '../../auth/guards/jwt/jwt.guard';

// Repositories
import { UserRepository } from '../../auth/repositories/user.repository';
import { PasswordResetRepository } from '../../auth/repositories/password-reset-token.repository';
import { EmailVerificationTokenRepository } from '../../auth/repositories/email-verification-token.repository';

@Global()
@Module({
  imports: [
    // Include DatabaseModule as it's required for repositories
    DatabaseModule,

    // Centralized JWT configuration
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_SECRET');
        if (!secret) {
          throw new Error('JWT_SECRET is not defined in environment variables');
        }
        return {
          secret,
          signOptions: {
            expiresIn: configService.get('JWT_EXPIRATION', '1h'),
            algorithm: 'HS256',
          },
          verifyOptions: {
            algorithms: ['HS256'],
          },
        };
      },
    }),

    // Centralized Mailer configuration
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const host = configService.get('mailer.host');
        const port = configService.get('mailer.port');
        const user = configService.get('mailer.user');
        const pass = configService.get('mailer.pass');

        if (!host || !port || !user || !pass) {
          throw new Error('Missing required mailer configuration');
        }

        return {
          transport: {
            host,
            port,
            secure: configService.get('mailer.secure', false),
            auth: { user, pass },
            connectionTimeout: 10000,
            greetingTimeout: 10000,
            socketTimeout: 10000,
          },
          defaults: {
            from: configService.get('mailer.from'),
          },
          template: {
            dir: join(__dirname, '../../auth/templates'),
            adapter: new HandlebarsAdapter(),
            options: {
              strict: true,
            },
          },
          preview: process.env.NODE_ENV !== 'production',
        };
      },
    }),
  ],

  providers: [
    // Core Services
    TokenService,
    EmailService,
    OtpService,

    // Repositories
    UserRepository,
    PasswordResetRepository,
    EmailVerificationTokenRepository,

    // Guards with factory pattern for proper initialization
    {
      provide: JwtAuthGuard,
      useFactory: (
        tokenService: TokenService,
        jwtService: JwtService,
        configService: ConfigService,
      ) => {
        return new JwtAuthGuard(tokenService, jwtService, configService);
      },
      inject: [TokenService, JwtService, ConfigService],
    },
  ],

  exports: [
    // Export all necessary services and modules
    JwtModule,
    MailerModule,
    TokenService,
    EmailService,
    OtpService,
    JwtAuthGuard,
    UserRepository,
    PasswordResetRepository,
    EmailVerificationTokenRepository,
  ],
})
export class SharedModule {}
