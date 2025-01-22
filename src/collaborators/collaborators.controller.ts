import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse as SwaggerApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import {
  CollaboratorService,
  SongCollaboratorService,
} from './collaborators.service';
import {
  CreateCollaboratorDto,
  // UpdateCollaboratorDto,
  CreateSongCollaboratorDto,
  UpdateSongCollaboratorDto,
  CollaboratorResponseDto,
  SongCollaboratorResponseDto,
} from './dto/collaborator.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt/jwt.guard';
import { SongOwnerGuard } from 'src/auth/guards/owner.guard';
import { CollaboratorRole } from './entities/collaborator.entity';

interface ApiResponse<T = any> {
  statusCode: number;
  message: string;
  data?: T;
}

@ApiTags('collaborators')
@Controller('collaborators')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CollaboratorController {
  constructor(
    private readonly collaboratorService: CollaboratorService,
    private readonly songCollaboratorService: SongCollaboratorService,
  ) {}

  // Base Collaborator Endpoints
  @Post()
  @ApiOperation({ summary: 'Create a new collaborator' })
  @SwaggerApiResponse({
    status: HttpStatus.CREATED,
    description: 'Collaborator created successfully',
    type: CollaboratorResponseDto,
  })
  async create(
    @Body() createCollaboratorDto: CreateCollaboratorDto,
  ): Promise<ApiResponse<CollaboratorResponseDto>> {
    return this.collaboratorService.create(createCollaboratorDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all collaborators' })
  @SwaggerApiResponse({
    status: HttpStatus.OK,
    description: 'Returns all collaborators',
    type: [CollaboratorResponseDto],
  })
  async findAll(): Promise<ApiResponse<CollaboratorResponseDto[]>> {
    return this.collaboratorService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a collaborator by ID' })
  @ApiParam({ name: 'id', type: String })
  @SwaggerApiResponse({
    status: HttpStatus.OK,
    description: 'Returns a collaborator',
    type: CollaboratorResponseDto,
  })
  async findOne(
    @Param('id') id: string,
  ): Promise<ApiResponse<CollaboratorResponseDto>> {
    return this.collaboratorService.findOne(id);
  }

  // Song Collaborator Endpoints
  @Post('song/:songId/contributions')
  @UseGuards(SongOwnerGuard)
  @ApiOperation({ summary: 'Add a contributor to a song' })
  @ApiParam({ name: 'songId', type: String })
  @SwaggerApiResponse({
    status: HttpStatus.CREATED,
    description: 'Contributor added successfully',
    type: SongCollaboratorResponseDto,
  })
  async addContributor(
    @Param('songId') songId: string,
    @Body() createDto: CreateSongCollaboratorDto,
  ): Promise<ApiResponse<SongCollaboratorResponseDto>> {
    // Ensure songId from path matches DTO
    createDto.songId = songId;
    return this.songCollaboratorService.createContribution(createDto);
  }

  @Get('song/:songId/contributions')
  @UseGuards(SongOwnerGuard)
  @ApiOperation({ summary: 'Get all contributors for a song' })
  @ApiParam({ name: 'songId', type: String })
  @SwaggerApiResponse({
    status: HttpStatus.OK,
    description: 'Returns all song contributors',
    type: [SongCollaboratorResponseDto],
  })
  async getSongContributors(
    @Param('songId') songId: string,
  ): Promise<ApiResponse<SongCollaboratorResponseDto[]>> {
    return this.songCollaboratorService.findBySong(songId);
  }

  @Patch('song/:songId/contributions/:contributorId')
  @UseGuards(SongOwnerGuard)
  @ApiOperation({ summary: 'Update a contribution' })
  @ApiParam({ name: 'songId', type: String, description: 'ID of the song' })
  @ApiParam({
    name: 'contributorId',
    type: String,
    description: 'ID of the contribution to update',
  })
  @SwaggerApiResponse({
    status: HttpStatus.OK,
    description: 'Contribution updated successfully',
    type: SongCollaboratorResponseDto,
  })
  async updateContribution(
    @Param('songId') songId: string,
    @Param('contributorId') contributorId: string,
    @Body() updateDto: UpdateSongCollaboratorDto,
  ): Promise<ApiResponse<SongCollaboratorResponseDto>> {
    // SongOwnerGuard will validate songId ownership
    // Find the specific contribution using both IDs
    return this.songCollaboratorService.updateContribution(
      contributorId,
      updateDto,
    );
  }

  @Delete('contributions/:id')
  @UseGuards(SongOwnerGuard)
  @ApiOperation({ summary: 'Delete a contribution' })
  @ApiParam({ name: 'id', type: String })
  @SwaggerApiResponse({
    status: HttpStatus.OK,
    description: 'Contribution deleted successfully',
  })
  async deleteContribution(@Param('id') id: string): Promise<ApiResponse> {
    return this.songCollaboratorService.deleteContribution(id);
  }

  @Get('song/:songId/contributions/role/:role')
  @UseGuards(SongOwnerGuard)
  @ApiOperation({ summary: 'Get song contributors by role' })
  @ApiParam({ name: 'songId', type: String })
  @ApiParam({ name: 'role', enum: CollaboratorRole })
  @SwaggerApiResponse({
    status: HttpStatus.OK,
    description: 'Returns contributors for specific role',
    type: [SongCollaboratorResponseDto],
  })
  async getSongContributorsByRole(
    @Param('songId') songId: string,
    @Param('role') role: CollaboratorRole,
  ): Promise<ApiResponse<SongCollaboratorResponseDto[]>> {
    return this.songCollaboratorService.findBySongAndRole(songId, role);
  }
}
