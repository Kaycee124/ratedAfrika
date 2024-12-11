// import { Module, forwardRef } from '@nestjs/common';
// import { UsersService } from './users.service';
// import { UsersController } from './users.controller';
// import { User } from './user.entity';
// import { TypeOrmModule } from '@nestjs/typeorm';
// // import { Label } from 'src/label/label.entity';
// // import { Artist } from 'src/artists/entities/artist.entity';
// // import { Collaborator } from 'src/collaborators/entities/collaborator.entity';
// // import { Lyrics } from 'src/lyrics/entities/lyrics.entity';
// import { customLoggerClass } from 'src/logger/logger.service';
// import { EmailVerificationTokenRepository } from 'src/auth/repositories/email-verification-token.repository';
// import { PasswordResetRepository } from 'src/auth/repositories/password-reset-token.repository';
// import { UserRepository } from 'src/auth/repositories/user.repository';
// import { PasswordReset } from './Entities/password-reset-token.entity';
// import { EmailVerificationToken } from './Entities/email-verification.entity';
// // import { AuthModule } from 'src/auth/auth.module';
// import { JwtModule, JwtService } from '@nestjs/jwt';
// // import { JwtStrategy } from 'src/auth/jwt.strategy';
// // import { AuthService } from 'src/auth/auth.service';
// // import { TokenService } from 'src/auth/services/token.service';
// // import { EmailService } from 'src/auth/services/email.service';
// // import { OtpService } from 'src/auth/services/otp.service';
// import { AuthModule } from 'src/auth/auth.module';
// import { Otp } from './Entities/otp.entity';

// @Module({
//   imports: [
//     // Simplified TypeOrmModule import to just User entity
//     TypeOrmModule.forFeature([
//       User,
//       PasswordReset,
//       EmailVerificationToken,
//       Otp,
//     ]),
//     // Added forwardRef to break circular dependency with AuthModule
//     forwardRef(() => AuthModule),
//   ],
//   providers: [
//     UsersService,
//     UserRepository,
//     PasswordResetRepository,
//     EmailVerificationTokenRepository,
//     customLoggerClass,
//     JwtService,
//     JwtModule,
//     // JwtStrategy,
//     // AuthService,
//     // TokenService,
//     // EmailService,
//     // OtpService,
//   ],
//   controllers: [UsersController],
//   exports: [
//     UsersService,
//     UserRepository,
//     PasswordResetRepository,
//     EmailVerificationTokenRepository,
//   ],
// })
// export class UsersModule {}

// users.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './user.entity';
import { customLoggerClass } from 'src/logger/logger.service';
import { EmailVerificationTokenRepository } from 'src/auth/repositories/email-verification-token.repository';
import { PasswordResetRepository } from 'src/auth/repositories/password-reset-token.repository';
import { UserRepository } from 'src/auth/repositories/user.repository';
import { PasswordReset } from './Entities/password-reset-token.entity';
import { EmailVerificationToken } from './Entities/email-verification.entity';
import { AuthModule } from 'src/auth/auth.module';
import { Otp } from './Entities/otp.entity';

@Module({
  imports: [
    // Entity registration
    TypeOrmModule.forFeature([
      User,
      PasswordReset,
      EmailVerificationToken,
      Otp,
    ]),
    // Maintain circular dependency resolution
    forwardRef(() => AuthModule),
  ],
  providers: [
    UsersService,
    UserRepository,
    PasswordResetRepository,
    EmailVerificationTokenRepository,
    customLoggerClass,
    // REMOVED: JwtService and JwtModule as they're now provided by global AuthModule
  ],
  controllers: [UsersController],
  exports: [
    UsersService,
    UserRepository,
    PasswordResetRepository,
    EmailVerificationTokenRepository,
  ],
})
export class UsersModule {}
