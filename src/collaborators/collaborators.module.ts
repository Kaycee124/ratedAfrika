// // import { Module } from '@nestjs/common';
// // import { TypeOrmModule } from '@nestjs/typeorm';
// // import { CollaboratorSplit } from './entities/collaborator-split.entity';
// // import { Collaborator } from './entities/collaborator.entity';
// // import { JwtService } from '@nestjs/jwt';
// // import { JwtModule } from '@nestjs/jwt';

// // @Module({
// //   imports: [TypeOrmModule.forFeature([Collaborator, CollaboratorSplit])],
// //   providers: [JwtModule, JwtService],
// // })
// // export class CollaboratorsModule {}

// import { Module } from '@nestjs/common';
// import { TypeOrmModule } from '@nestjs/typeorm';
// import { CollaboratorSplit } from './entities/collaborator-split.entity';
// import { Collaborator } from './entities/collaborator.entity';
// import { AuthModule } from 'src/auth/auth.module';

// @Module({
//   imports: [
//     TypeOrmModule.forFeature([Collaborator, CollaboratorSplit]),
//     AuthModule,
//   ],
// })
// export class CollaboratorsModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CollaboratorSplit } from './entities/collaborator-split.entity';
import { Collaborator } from './entities/collaborator.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Collaborator, CollaboratorSplit]),
    // REMOVED: JwtModule and JwtService imports
  ],
  providers: [], // REMOVED: JwtModule and JwtService from providers
})
export class CollaboratorsModule {}
