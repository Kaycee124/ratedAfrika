import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
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
import { ArtistsService } from './artist.service';
import { CreateArtistDto } from './dtos/create-artist.dto';
import { UpdateArtistDto } from './dtos/update-artist.dto';
import { QueryArtistDto } from './dtos/query-artist.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt/jwt.guard';
import {
  SubscriptionGuard,
  RequiredSubscriptions,
} from 'src/auth/guards/subcription.guard';
import { Sub_Plans } from '../users/user.entity';
import { Artist } from './entities/artist.entity';
import {
  SimplifiedCreateArtistDto,
  SimplifiedCreateTempArtistDto,
} from './dtos/create-artist.dto';
import { TempArtist } from './entities/temp-artist.entity';

interface ApiResponse<T = any> {
  statusCode: number;
  message: string;
  data?: T;
}

@ApiTags('artists')
@Controller('artists')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ArtistsController {
  constructor(private readonly artistsService: ArtistsService) {}

  @Post('create-profile')
  @UseGuards(SubscriptionGuard)
  @RequiredSubscriptions(Sub_Plans.ARTIST, Sub_Plans.LABEL)
  @ApiOperation({ summary: 'Create a new artist profile' })
  @ApiBody({ type: CreateArtistDto })
  @SwaggerApiResponse({
    status: HttpStatus.CREATED,
    description: 'Artist profile created successfully',
  })
  @SwaggerApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Artist name is already taken',
  })
  @SwaggerApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient subscription plan',
  })
  async create(
    @Body() createArtistDto: CreateArtistDto,
    @Request() req,
  ): Promise<ApiResponse<Artist>> {
    console.log('Create Artist - User:', {
      id: req.user?.id,
      subscription: req.user?.subscription,
    });
    return await this.artistsService.create(createArtistDto, req.user);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all artist profiles with pagination and filters',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'genre', required: false, type: String })
  @ApiQuery({ name: 'country', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  @SwaggerApiResponse({
    status: HttpStatus.OK,
    description: 'Artists retrieved successfully',
  })
  async findAll(@Query() queryDto: QueryArtistDto): Promise<
    ApiResponse<{
      artists: Artist[];
      meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      };
    }>
  > {
    return await this.artistsService.findAll(queryDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an artist profile by ID' })
  @ApiParam({ name: 'id', type: String, description: 'Artist ID' })
  @SwaggerApiResponse({
    status: HttpStatus.OK,
    description: 'Artist retrieved successfully',
  })
  @SwaggerApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Artist not found',
  })
  async findOne(@Param('id') id: string): Promise<ApiResponse<Artist>> {
    return await this.artistsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(SubscriptionGuard)
  @RequiredSubscriptions(Sub_Plans.ARTIST, Sub_Plans.LABEL)
  @ApiOperation({ summary: 'Update an artist profile' })
  @ApiParam({ name: 'id', type: String, description: 'Artist ID' })
  @ApiBody({ type: UpdateArtistDto })
  @SwaggerApiResponse({
    status: HttpStatus.OK,
    description: 'Artist profile updated successfully',
  })
  @SwaggerApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Artist not found',
  })
  @SwaggerApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Permission denied or insufficient subscription',
  })
  @SwaggerApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Artist name is already taken',
  })
  async update(
    @Param('id') id: string,
    @Body() updateArtistDto: UpdateArtistDto,
    @Request() req,
  ): Promise<ApiResponse<Artist>> {
    console.log('Update Artist - User:', {
      id: req.user?.id,
      subscription: req.user?.subscription,
      artistId: id,
    });
    return await this.artistsService.update(id, updateArtistDto, req.user);
  }

  @Delete(':id')
  @UseGuards(SubscriptionGuard)
  @RequiredSubscriptions(Sub_Plans.ARTIST, Sub_Plans.LABEL)
  @ApiOperation({ summary: 'Delete an artist profile' })
  @ApiParam({ name: 'id', type: String, description: 'Artist ID' })
  @SwaggerApiResponse({
    status: HttpStatus.OK,
    description: 'Artist profile deleted successfully',
  })
  @SwaggerApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Artist not found',
  })
  @SwaggerApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Permission denied or insufficient subscription',
  })
  async remove(@Param('id') id: string, @Request() req): Promise<ApiResponse> {
    console.log('Delete Artist - User:', {
      id: req.user?.id,
      subscription: req.user?.subscription,
      artistId: id,
    });
    return await this.artistsService.remove(id, req.user);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get all artist profiles for a specific user' })
  @ApiParam({ name: 'userId', type: String, description: 'User ID' })
  @SwaggerApiResponse({
    status: HttpStatus.OK,
    description: 'User artists retrieved successfully',
  })
  @SwaggerApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found',
  })
  async findByUser(
    @Param('userId') userId: string,
  ): Promise<ApiResponse<Artist[]>> {
    return await this.artistsService.findByUser(userId);
  }
  // Add these endpoints to artist.controller.ts

  @Post('create-simple')
  @UseGuards(SubscriptionGuard)
  @RequiredSubscriptions(Sub_Plans.ARTIST, Sub_Plans.LABEL)
  @ApiOperation({ summary: 'Create a new artist profile with name and email' })
  @ApiBody({ type: SimplifiedCreateArtistDto })
  @SwaggerApiResponse({
    status: HttpStatus.CREATED,
    description: 'Artist profile created successfully',
  })
  @SwaggerApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Artist name or email is already taken',
  })
  @SwaggerApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid email format or missing required fields',
  })
  @SwaggerApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient subscription plan',
  })
  async createSimplifiedArtist(
    @Body() createDto: SimplifiedCreateArtistDto,
    @Request() req,
  ): Promise<ApiResponse<Artist & { newAccessToken?: string }>> {
    console.log('Create Simple Artist - User:', {
      id: req.user?.id,
      subscription: req.user?.subscription,
    });
    return await this.artistsService.createSimplifiedArtist(
      createDto,
      req.user,
    );
  }

  @Post('temp/create-simple')
  @UseGuards(SubscriptionGuard)
  @RequiredSubscriptions(Sub_Plans.ARTIST, Sub_Plans.LABEL)
  @ApiOperation({
    summary: 'Create a new temporary artist profile with just name',
  })
  @ApiBody({ type: SimplifiedCreateTempArtistDto })
  @SwaggerApiResponse({
    status: HttpStatus.CREATED,
    description: 'Temporary artist profile created successfully',
  })
  @SwaggerApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Temporary artist name is already taken',
  })
  async createSimplifiedTempArtist(
    @Body() createDto: SimplifiedCreateTempArtistDto,
  ): Promise<ApiResponse<TempArtist>> {
    return await this.artistsService.createSimplifiedTempArtist(createDto);
  }
}
