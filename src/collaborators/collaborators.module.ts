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

// src/collaborators/collaborators.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CollaboratorsController } from './collaborators.controller';
import { CollaboratorsService } from './collaborators.service';
import { CollaboratorSplitRepository } from './repositories/collaborator-splits.repository';
import { Collaborator } from './entities/collaborator.entity';
import { CollaboratorSplit } from './entities/collaborator-split.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Collaborator, CollaboratorSplit]),
    AuthModule, // This is already a global module from our knowledge base
  ],
  providers: [
    CollaboratorsService,
    CollaboratorSplitRepository, // Added this as a provider
  ],
  controllers: [CollaboratorsController],
  exports: [
    CollaboratorsService,
    CollaboratorSplitRepository, // Export it if needed by other modules
  ],
})
export class CollaboratorsModule {}
