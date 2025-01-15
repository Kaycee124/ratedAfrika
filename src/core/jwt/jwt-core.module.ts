// // src/core/jwt/jwt-core.module.ts
// import { Global, Module } from '@nestjs/common';
// import { JwtModule, JwtService } from '@nestjs/jwt';
// import { ConfigModule, ConfigService } from '@nestjs/config';
// import { JwtAuthGuard } from '../../auth/guards/jwt/jwt.guard';
// import { TokenService } from '../../auth/services/token.service';
// import { UserRepository } from '../../auth/repositories/user.repository';
// import { TypeOrmModule } from '@nestjs/typeorm';
// import { User } from '../../users/user.entity';

// @Global()
// @Module({
//   imports: [
//     TypeOrmModule.forFeature([User]),
//     JwtModule.registerAsync({
//       imports: [ConfigModule],
//       inject: [ConfigService],
//       useFactory: async (configService: ConfigService) => {
//         const secret = configService.get<string>('JWT_SECRET');
//         if (!secret) {
//           throw new Error('JWT_SECRET is not defined');
//         }
//         return {
//           secret,
//           signOptions: { expiresIn: '1h' },
//         };
//       },
//     }),
//   ],
//   providers: [
//     TokenService,
//     UserRepository,
//     {
//       provide: JwtAuthGuard,
//       useFactory: (
//         tokenService: TokenService,
//         jwtService: JwtService,
//         configService: ConfigService,
//       ) => {
//         console.log('Creating single JwtAuthGuard instance');
//         return new JwtAuthGuard(tokenService, jwtService, configService);
//       },
//       inject: [TokenService, JwtService, ConfigService],
//     },
//   ],
//   exports: [JwtModule, JwtAuthGuard, TokenService],
// })
// export class JwtCoreModule {}

import { Global, Module } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtAuthGuard } from '../../auth/guards/jwt/jwt.guard';
import { TokenService } from '../../auth/services/token.service';
import { UserRepository } from '../../auth/repositories/user.repository';
import { User } from '../../users/user.entity';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_SECRET');
        if (!secret) throw new Error('JWT_SECRET is not defined');
        return {
          secret,
          signOptions: {
            expiresIn: '1h',
            algorithm: 'HS256',
          },
          verifyOptions: {
            algorithms: ['HS256'],
          },
        };
      },
    }),
  ],
  providers: [
    TokenService,
    UserRepository,
    {
      provide: JwtAuthGuard,
      useFactory: (
        tokenService: TokenService,
        jwtService: JwtService,
        configService: ConfigService,
      ) => {
        console.log('Creating single JwtAuthGuard instance');
        return new JwtAuthGuard(tokenService, jwtService, configService);
      },
      inject: [TokenService, JwtService, ConfigService],
    },
  ],
  exports: [JwtModule, JwtAuthGuard, TokenService],
})
export class JwtCoreModule {}
