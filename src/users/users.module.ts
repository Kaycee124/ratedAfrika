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

import { Module, forwardRef } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { customLoggerClass } from 'src/logger/logger.service';
import { AuthModule } from 'src/auth/auth.module';
// import { SharedModule } from 'src/core/shared/shared.module';

// REMOVED: These imports are now handled by DatabaseModule
// import { TypeOrmModule } from '@nestjs/typeorm';
// import { User } from './user.entity';
// import { PasswordReset } from './Entities/password-reset-token.entity';
// import { EmailVerificationToken } from './Entities/email-verification.entity';
// import { Otp } from './Entities/otp.entity';

// REMOVED: These repositories are now provided by SharedModule
// import { UserRepository } from 'src/auth/repositories/user.repository';
// import { PasswordResetRepository } from 'src/auth/repositories/password-reset-token.repository';
// import { EmailVerificationTokenRepository } from 'src/auth/repositories/email-verification-token.repository';

@Module({
  imports: [
    // SharedModule,
    forwardRef(() => AuthModule),
    // REMOVED: TypeORM feature registration is now in DatabaseModule
  ],
  providers: [
    UsersService,
    customLoggerClass,
    // REMOVED: Repositories are now provided by SharedModule
  ],
  controllers: [UsersController],
  exports: [
    UsersService,
    // REMOVED: Repository exports as they're now provided globally by SharedModule
  ],
})
export class UsersModule {}
