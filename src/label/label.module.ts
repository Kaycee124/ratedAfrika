// // // src/labels/labels.module.ts
// // import { Module } from '@nestjs/common';
// // import { TypeOrmModule } from '@nestjs/typeorm';
// // import { LabelsController } from './label.controller';
// // import { LabelsService } from './label.service';
// // import { Label } from './label.entity';
// // import { Artist } from '../artists/entities/artist.entity';
// // import { UsersModule } from '../users/users.module';
// // import { User } from 'src/users/user.entity';
// // import { SongsModule } from 'src/songs/songs.module';
// // import { JwtModule, JwtService } from '@nestjs/jwt';
// // @Module({
// //   imports: [
// //     TypeOrmModule.forFeature([Label, Artist, User]),
// //     UsersModule,
// //     SongsModule, // Import UsersModule if you need access to user-related services
// //   ],
// //   controllers: [LabelsController],
// //   providers: [LabelsService, JwtModule, JwtService],
// //   exports: [LabelsService], // Export if other modules need to use the service
// // })
// // export class LabelsModule {}

// // 5. label.module.ts - Remove JwtModule direct import
// import { Module } from '@nestjs/common';
// import { TypeOrmModule } from '@nestjs/typeorm';
// import { LabelsController } from './label.controller';
// import { LabelsService } from './label.service';
// import { Label } from './label.entity';
// import { Artist } from '../artists/entities/artist.entity';
// import { UsersModule } from '../users/users.module';
// import { User } from 'src/users/user.entity';
// import { SongsModule } from 'src/songs/songs.module';
// // import { AuthModule } from 'src/auth/auth.module';

// @Module({
//   imports: [
//     TypeOrmModule.forFeature([Label, Artist, User]),
//     UsersModule,
//     SongsModule,
//   ],
//   controllers: [LabelsController],
//   providers: [LabelsService],
//   exports: [LabelsService],
// })
// export class LabelsModule {}

import { Module } from '@nestjs/common';
import { LabelsController } from './label.controller';
import { LabelsService } from './label.service';
import { UsersModule } from '../users/users.module';
import { SongsModule } from '../songs/songs.module';

@Module({
  imports: [UsersModule, SongsModule],
  controllers: [LabelsController],
  providers: [LabelsService],
  exports: [LabelsService],
})
export class LabelsModule {}
