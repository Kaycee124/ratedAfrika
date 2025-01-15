// // // import { Module } from '@nestjs/common';
// // // import { TypeOrmModule } from '@nestjs/typeorm';
// // // import { Label } from 'src/label/label.entity';
// // // import { Song } from 'src/songs/entities/song.entity';
// // // import { User } from 'src/users/user.entity';
// // // import { ArtistsController } from './artist.controller';
// // // import { ArtistsService } from './artist.service';
// // // import { Artist } from './entities/artist.entity';
// // // import { JwtModule, JwtService } from '@nestjs/jwt';

// // // @Module({
// // //   imports: [
// // //     // Register all entities that are directly related to Artist
// // //     TypeOrmModule.forFeature([Artist, Song, User, Label]),
// // //   ],
// // //   controllers: [ArtistsController],
// // //   providers: [ArtistsService, JwtModule, JwtService],
// // //   exports: [ArtistsService],
// // // })
// // // export class ArtistsModule {}

// // /////////////////////////////////////
// // // ///#############a line demarcation then

// // import { Module, forwardRef } from '@nestjs/common';
// // import { TypeOrmModule } from '@nestjs/typeorm';
// // // import { JwtModule } from '@nestjs/jwt';
// // import { ConfigModule } from '@nestjs/config';
// // import { Label } from 'src/label/label.entity';
// // import { Song } from 'src/songs/entities/song.entity';
// // import { User } from 'src/users/user.entity';
// // import { ArtistsController } from './artist.controller';
// // import { ArtistsService } from './artist.service';
// // import { Artist } from './entities/artist.entity';
// // // import { TokenService } from '../auth/services/token.service';
// // import { AuthModule } from 'src/auth/auth.module';

// // @Module({
// //   imports: [
// //     TypeOrmModule.forFeature([Artist, Song, User, Label]),
// //     ConfigModule,
// //     forwardRef(() => AuthModule),
// //   ],
// //   controllers: [ArtistsController],
// //   providers: [
// //     ArtistsService,
// //     // TokenService, // Add TokenService to providers since JwtAuthGuard depends on it
// //   ],
// //   exports: [ArtistsService],
// // })
// // export class ArtistsModule {}

// import { Module, forwardRef } from '@nestjs/common';
// import { TypeOrmModule } from '@nestjs/typeorm';
// import { Label } from 'src/label/label.entity';
// import { Song } from 'src/songs/entities/song.entity';
// import { User } from 'src/users/user.entity';
// import { ArtistsController } from './artist.controller';
// import { ArtistsService } from './artist.service';
// import { Artist } from './entities/artist.entity';
// import { AuthModule } from 'src/auth/auth.module';

// @Module({
//   imports: [
//     TypeOrmModule.forFeature([Artist, Song, User, Label]),
//     forwardRef(() => AuthModule),
//   ],
//   controllers: [ArtistsController],
//   providers: [ArtistsService],
//   exports: [ArtistsService],
// })
// export class ArtistsModule {}
// artists.module.ts
// import { Module, forwardRef } from '@nestjs/common';
// import { TypeOrmModule } from '@nestjs/typeorm';
// import { ConfigModule } from '@nestjs/config';
// import { Label } from 'src/label/label.entity';
// import { Song } from 'src/songs/entities/song.entity';
// import { User } from 'src/users/user.entity';
// import { ArtistsController } from './artist.controller';
// import { ArtistsService } from './artist.service';
// import { Artist } from './entities/artist.entity';
// import { AuthModule } from 'src/auth/auth.module';

// @Module({
//   imports: [
//     TypeOrmModule.forFeature([Artist, Song, User, Label]),
//     ConfigModule,
//     forwardRef(() => AuthModule),
//   ],
//   controllers: [ArtistsController],
//   providers: [
//     ArtistsService,
//     // REMOVED: TokenService
//   ],
//   exports: [ArtistsService],
// })
// export class ArtistsModule {}

import { Module, forwardRef } from '@nestjs/common';
import { ArtistsController } from './artist.controller';
import { ArtistsService } from './artist.service';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from 'src/core/database/database.module';

@Module({
  imports: [forwardRef(() => AuthModule), DatabaseModule],
  controllers: [ArtistsController],
  providers: [ArtistsService],
  exports: [ArtistsService],
})
export class ArtistsModule {}
