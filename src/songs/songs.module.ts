import { Module } from '@nestjs/common';
// needed// import { SongsService } from './songs.service';
import { SongsController } from './songs.controller';
// import { TypeOrmModule } from '@nestjs/typeorm';
// import { User } from 'src/users/user.entity';
// import { Artist } from 'src/artists/entities/artist.entity';
// import { Collaborator } from 'src/collaborators/entities/collaborator.entity';
// import { Lyrics } from 'src/lyrics/entities/lyrics.entity';
// import { Song } from './entities/song.entity';

@Module({
  // imports: [
  //   TypeOrmModule.forFeature([User, Artist, Collaborator, Lyrics, Song]),
  // ],
  // providers: [SongsService],
  controllers: [SongsController],
})
export class SongsModule {}
