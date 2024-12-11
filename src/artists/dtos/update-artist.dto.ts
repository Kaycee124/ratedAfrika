// // src/artists/dto/update-artist.dto.ts
// // import { PartialType } from '@nestjs/mapped-types';
// import { CreateArtistDto } from './create-artist.dto';

// export class UpdateArtistDto extends PartialType(CreateArtistDto) {}
// src/artists/dto/update-artist.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateArtistDto } from './create-artist.dto';

export class UpdateArtistDto extends PartialType(CreateArtistDto) {}
