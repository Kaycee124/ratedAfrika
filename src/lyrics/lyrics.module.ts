// // src/lyrics/lyrics.module.ts
// import { Module } from '@nestjs/common';
// import { TypeOrmModule } from '@nestjs/typeorm';
// import { LyricsController } from './lyrics.controller';
// import { LyricsService } from './lyrics.service';
// import { Lyrics } from './entities/lyrics.entity';
// import { Song } from 'src/songs/entities/song.entity';
// import { JwtModule } from '@nestjs/jwt';
// // import { JwtModule, JwtService } from '@nestjs/jwt';

// @Module({
//   imports: [TypeOrmModule.forFeature([Lyrics, Song]), JwtModule],
//   controllers: [LyricsController],
//   providers: [LyricsService],
//   exports: [LyricsService],
// })
// export class LyricsModule {}
import { Module } from '@nestjs/common';
import { LyricsController } from './lyrics.controller';
import { LyricsService } from './lyrics.service';

@Module({
  controllers: [LyricsController],
  providers: [LyricsService],
  exports: [LyricsService],
})
export class LyricsModule {}
