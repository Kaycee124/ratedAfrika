import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  Request,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse as SwaggerApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { SongsService } from './songs.service';
import {
  CreateSongDto,
  UpdateSongDto,
  QuerySongDto,
  CreateReleaseContainerDto,
  UpdateReleaseContainerDto,
  QueryReleaseContainerDto,
  DiscographyResponseDto,
} from './dtos/song.dto';
import { JwtAuthGuard } from '../auth/guards/jwt/jwt.guard';
import {
  ReleaseContainerOwnerGuard,
  SongOwnerGuard,
} from '../auth/guards/owner.guard';
import { Song } from './entities/song.entity';
import { ReleaseContainer } from './entities/album.entity';
import {
  SubscriptionGuard,
  RequiredSubscriptions,
} from '../auth/guards/subcription.guard';
import { Sub_Plans } from '../users/user.entity';
import { AddArtistToSongDto } from './dtos/song-artist.dto';

interface ApiResponse<T = any> {
  statusCode: number;
  message: string;
  data?: T;
}
interface ReviewSubmissionResponse {
  song?: Song;
  validationDetails?: {
    isValid: boolean;
    missingFields?: string[];
  };
}
@ApiTags('songs')
@Controller('songs')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SongsController {
  constructor(private readonly songsService: SongsService) {}

  // Release Container Endpoints
  @Post('containers')
  @UseGuards(SubscriptionGuard)
  @RequiredSubscriptions(Sub_Plans.INDEPENDENT, Sub_Plans.PRO, Sub_Plans.LABEL)
  @ApiOperation({ summary: 'Create a new release container (Album/EP)' })
  @ApiBody({ type: CreateReleaseContainerDto })
  @SwaggerApiResponse({
    status: HttpStatus.CREATED,
    description: 'Release container created successfully',
  })
  async createReleaseContainer(
    @Body() createDto: CreateReleaseContainerDto,
    @Request() req,
  ): Promise<ApiResponse<ReleaseContainer>> {
    return this.songsService.createReleaseContainer(createDto, req.user);
  }

  @Patch('containers/:id')
  @UseGuards(ReleaseContainerOwnerGuard)
  @RequiredSubscriptions(Sub_Plans.INDEPENDENT, Sub_Plans.PRO, Sub_Plans.LABEL)
  @ApiOperation({ summary: 'Update a release container' })
  @ApiParam({ name: 'id', description: 'Release container ID' })
  @ApiBody({ type: UpdateReleaseContainerDto })
  @SwaggerApiResponse({
    status: HttpStatus.OK,
    description: 'Release container updated successfully',
  })
  async updateReleaseContainer(
    @Param('id') id: string,
    @Body() updateDto: UpdateReleaseContainerDto,
    @Request() req,
  ): Promise<ApiResponse<ReleaseContainer>> {
    return this.songsService.updateReleaseContainer(id, updateDto, req.user);
  }

  @Post('containers/:id/submit')
  @UseGuards(SongOwnerGuard)
  @RequiredSubscriptions(Sub_Plans.INDEPENDENT, Sub_Plans.PRO, Sub_Plans.LABEL)
  @ApiOperation({ summary: 'Submit a release container for review' })
  @ApiParam({ name: 'id', description: 'Release container ID' })
  @SwaggerApiResponse({
    status: HttpStatus.OK,
    description: 'Release container submitted for review',
  })
  async submitReleaseContainerForReview(
    @Param('id') id: string,
    @Request() req,
  ): Promise<ApiResponse<ReleaseContainer>> {
    return this.songsService.submitReleaseContainerForReview(id, req.user);
  }

  @Get('containers')
  @ApiOperation({ summary: 'Query release containers with filters' })
  @ApiQuery({ type: QueryReleaseContainerDto })
  @SwaggerApiResponse({
    status: HttpStatus.OK,
    description: 'Release containers retrieved successfully',
  })
  async queryReleaseContainers(
    @Query() queryDto: QueryReleaseContainerDto,
    @Request() req,
  ): Promise<
    ApiResponse<{
      containers: ReleaseContainer[];
      total: number;
      page: number;
      limit: number;
    }>
  > {
    return this.songsService.queryReleaseContainers(queryDto, req.user);
  }

  @Get('containers/:id')
  @ApiOperation({ summary: 'Get release container details' })
  @ApiParam({ name: 'id', description: 'Release container ID' })
  @SwaggerApiResponse({
    status: HttpStatus.OK,
    description: 'Release container details retrieved successfully',
  })
  async getReleaseContainerDetails(
    @Param('id') id: string,
    @Request() req,
  ): Promise<ApiResponse<ReleaseContainer>> {
    return this.songsService.getReleaseContainerDetails(id, req.user);
  }

  @Delete('containers/:id')
  @UseGuards(SongOwnerGuard)
  @RequiredSubscriptions(Sub_Plans.INDEPENDENT, Sub_Plans.PRO, Sub_Plans.LABEL)
  @ApiOperation({ summary: 'Delete a release container' })
  @ApiParam({ name: 'id', description: 'Release container ID' })
  @SwaggerApiResponse({
    status: HttpStatus.OK,
    description: 'Release container deleted successfully',
  })
  async deleteReleaseContainer(
    @Param('id') id: string,
    @Request() req,
  ): Promise<ApiResponse> {
    return this.songsService.deleteReleaseContainer(id, req.user);
  }

  // Song Endpoints
  @Post()
  @UseGuards(SubscriptionGuard)
  @RequiredSubscriptions(Sub_Plans.INDEPENDENT, Sub_Plans.PRO, Sub_Plans.LABEL)
  @ApiOperation({ summary: 'Create a new song' })
  @ApiBody({ type: CreateSongDto })
  @SwaggerApiResponse({
    status: HttpStatus.CREATED,
    description: 'Song created successfully',
  })
  async createSong(
    @Body() createDto: CreateSongDto,
    @Request() req,
  ): Promise<ApiResponse<Song>> {
    return this.songsService.createSong(createDto, req.user);
  }

  @Patch(':id')
  @UseGuards(SongOwnerGuard)
  @RequiredSubscriptions(Sub_Plans.INDEPENDENT, Sub_Plans.PRO, Sub_Plans.LABEL)
  @ApiOperation({ summary: 'Update a song' })
  @ApiParam({ name: 'id', description: 'Song ID' })
  @ApiBody({ type: UpdateSongDto })
  @SwaggerApiResponse({
    status: HttpStatus.OK,
    description: 'Song updated successfully',
  })
  async updateSong(
    @Param('id') id: string,
    @Body() updateDto: UpdateSongDto,
    @Request() req,
  ): Promise<ApiResponse<Song>> {
    return this.songsService.updateSong(id, updateDto, req.user);
  }

  @Post(':id/submit')
  @UseGuards(SongOwnerGuard)
  @RequiredSubscriptions(Sub_Plans.INDEPENDENT, Sub_Plans.PRO, Sub_Plans.LABEL)
  @ApiOperation({ summary: 'Submit a song for review' })
  @ApiParam({ name: 'id', description: 'Song ID' })
  @SwaggerApiResponse({
    status: HttpStatus.OK,
    description: 'Song submitted for review',
  })
  async submitSongForReview(
    @Param('id') id: string,
    @Request() req,
  ): Promise<ApiResponse<ReviewSubmissionResponse>> {
    return this.songsService.submitSongForReview(id, req.user);
  }

  @Get()
  @ApiOperation({ summary: 'Query songs with filters' })
  @ApiQuery({ type: QuerySongDto })
  @SwaggerApiResponse({
    status: HttpStatus.OK,
    description: 'Songs retrieved successfully',
  })
  async querySongs(
    @Query() queryDto: QuerySongDto,
    @Request() req,
  ): Promise<
    ApiResponse<{
      songs: Song[];
      total: number;
      page: number;
      limit: number;
    }>
  > {
    return this.songsService.querySongs(queryDto, req.user);
  }

  @Get('userObject')
  @ApiOperation({ summary: 'Get songs by user' })
  @SwaggerApiResponse({
    status: HttpStatus.OK,
    description: 'Songs retrieved successfully',
  })
  async getSongsByUser(@Request() req): Promise<ApiResponse<Song[]>> {
    return this.songsService.getSongsByUser(req.user);
  }

  @Get('release-containers/userObject')
  @ApiOperation({ summary: 'Get release containers by user' })
  @SwaggerApiResponse({
    status: HttpStatus.OK,
    description: 'Release containers retrieved successfully',
  })
  async getReleaseContainersByUser(
    @Request() req,
  ): Promise<ApiResponse<ReleaseContainer[]>> {
    return this.songsService.getReleaseContainersByUser(req.user);
  }

  @Get('release-containers/artist/:artistId')
  @ApiOperation({ summary: 'Get release containers by artist' })
  @SwaggerApiResponse({
    status: HttpStatus.OK,
    description: 'Release containers retrieved successfully',
  })
  async getReleaseContainersByArtist(
    @Param('artistId') artistId: string,
    @Request() req,
  ): Promise<ApiResponse<ReleaseContainer[]>> {
    return this.songsService.getReleaseContainersByArtist(artistId, req.user);
  }

  @Get('artist/:artistId')
  @ApiOperation({ summary: 'Get songs by artist' })
  @SwaggerApiResponse({
    status: HttpStatus.OK,
    description: 'Songs retrieved successfully',
  })
  async getArtistSongs(
    @Param('artistId') artistId: string,
    @Request() req,
  ): Promise<ApiResponse<Song[]>> {
    return this.songsService.getArtistSongs(artistId, req.user);
  }

  @Get('artist/:artistId/discography')
  @ApiOperation({ summary: 'Get artist discography' })
  @ApiParam({ name: 'artistId', description: 'Artist ID' })
  @SwaggerApiResponse({
    status: 200,
    description: 'Artist discography retrieved successfully',
  })
  @SwaggerApiResponse({ status: 404, description: 'Artist not found' })
  async getArtistDiscography(
    @Param('artistId') artistId: string,
    @Request() req,
  ): Promise<ApiResponse<DiscographyResponseDto>> {
    return this.songsService.getArtistDiscography(artistId, req.user);
  }

  @Get(':id')
  @UseGuards(SubscriptionGuard)
  @ApiOperation({ summary: 'Get song details' })
  @ApiParam({ name: 'id', description: 'Song ID' })
  @SwaggerApiResponse({
    status: HttpStatus.OK,
    description: 'Song details retrieved successfully',
  })
  async getSongDetails(
    @Param('id') id: string,
    @Request() req,
  ): Promise<ApiResponse<Song>> {
    return this.songsService.getSongDetails(id, req.user);
  }

  @Delete(':id')
  @UseGuards(SongOwnerGuard)
  @RequiredSubscriptions(Sub_Plans.INDEPENDENT, Sub_Plans.PRO, Sub_Plans.LABEL)
  @ApiOperation({ summary: 'Delete a song' })
  @ApiParam({ name: 'id', description: 'Song ID' })
  @SwaggerApiResponse({
    status: HttpStatus.OK,
    description: 'Song deleted successfully',
  })
  async deleteSong(
    @Param('id') id: string,
    @Request() req,
  ): Promise<ApiResponse> {
    return this.songsService.deleteSong(id, req.user);
  }

  @Get(':id/artists')
  @ApiOperation({
    summary: 'Get all artists (primary, featured, temp) for a song',
  })
  @ApiParam({ name: 'id', description: 'Song ID' })
  @SwaggerApiResponse({
    status: HttpStatus.OK,
    description: 'Artists retrieved successfully',
  })
  async getSongArtists(@Param('id') id: string): Promise<ApiResponse> {
    return this.songsService.getSongArtists(id);
  }

  @Post(':id/artists')
  @UseGuards(SubscriptionGuard) // Optional: Restrict adding artists to paid plans?
  @RequiredSubscriptions(Sub_Plans.PRO, Sub_Plans.LABEL)
  @ApiOperation({
    summary: 'Add an artist to a song',
    description:
      'Add either a registered platform artist (via artistId) or a temporary artist (via tempArtistName) as a featured artist.',
  })
  @ApiParam({ name: 'id', description: 'Song ID' })
  @ApiBody({ type: AddArtistToSongDto })
  @SwaggerApiResponse({
    status: HttpStatus.CREATED,
    description: 'Artist added successfully',
  })
  async addArtistToSong(
    @Param('id') id: string,
    @Body() addArtistDto: AddArtistToSongDto,
    @Request() req,
  ): Promise<ApiResponse> {
    return this.songsService.addArtistToSong(id, addArtistDto, req.user);
  }
}
