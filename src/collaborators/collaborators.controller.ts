import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  // HttpStatus,
  ParseUUIDPipe,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CollaboratorService } from './collaborators.service';
import {
  CreateCollaboratorDto,
  // UpdateCollaboratorDto,
  // CreateSongCollaboratorDto,
  // UpdateSongCollaboratorDto,
  // SongCollaboratorResponseDto,
  UpdateCollaboratorDto,
} from './dto/collaborator.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt/jwt.guard';
// import { SongOwnerGuard } from 'src/auth/guards/owner.guard';
// import { CollaboratorRole } from './entities/collaborator.entity';

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
  constructor(private readonly collaboratorService: CollaboratorService) {}

  // Base Collaborator Endpoints
  @Post()
  async create(
    @Body() createCollaboratorDto: CreateCollaboratorDto,
    @Req() req: any,
  ): Promise<ApiResponse> {
    console.log('Create Collaborator - User:', {
      id: req.user?.id,
    });

    return this.collaboratorService.create(createCollaboratorDto, req.user);
  }

  @Get()
  async findAll(): Promise<ApiResponse> {
    const result = await this.collaboratorService.findAll();
    return {
      statusCode: result.statusCode,
      message: result.message,
      data: result.data,
    };
  }

  @Get('user/:userId')
  async findAllUser(
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<ApiResponse> {
    const result = await this.collaboratorService.findAllUser(userId);
    return {
      statusCode: result.statusCode,
      message: result.message,
      data: result.data,
    };
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<ApiResponse> {
    const result = await this.collaboratorService.findOne(id);
    return {
      statusCode: result.statusCode,
      message: result.message,
      data: result.data, // Cast for type consistency
    };
  }

  @Get('email/:email')
  async findByEmail(@Param('email') email: string): Promise<ApiResponse> {
    const result = await this.collaboratorService.findByEmail(email);
    return {
      statusCode: result.statusCode,
      message: result.message,
      data: result.data,
    };
  }

  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCollaboratorDto: UpdateCollaboratorDto,
  ): Promise<ApiResponse> {
    const result = await this.collaboratorService.update(
      id,
      updateCollaboratorDto,
    );
    return {
      statusCode: result.statusCode,
      message: result.message,
      data: result.data,
    };
  }

  // @Get()
  // async findAll(): Promise<Collaborator[]> {
  //   // Return an array of Collaborator entities
  //   return (await this.collaboratorService.findAll()).data;
  // }

  // @Get('user/:userId')
  // async findAllUser(
  //   @Param('userId', ParseUUIDPipe) userId: string,
  // ): Promise<Collaborator[]> {
  //   return (await this.collaboratorService.findAllUser(userId)).data;
  // }

  // @Get(':id')
  // async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Collaborator> {
  //   // Return a single Collaborator entity
  //   const result = await this.collaboratorService.findOne(id);
  //   if (!result.data) {
  //     throw result;
  //   }
  //   return result.data;
  // }

  // @Get('email/:email')
  // async findByEmail(@Param('email') email: string): Promise<Collaborator> {
  //   const result = await this.collaboratorService.findByEmail(email);
  //   if (!result.data) {
  //     throw result;
  //   }
  //   return result.data;
  // }

  // @Patch(':id')
  // async update(
  //   @Param('id', ParseUUIDPipe) id: string,
  //   @Body() updateCollaboratorDto: UpdateCollaboratorDto,
  // ): Promise<Collaborator> {
  //   const result = await this.collaboratorService.update(
  //     id,
  //     updateCollaboratorDto,
  //   );
  //   if (!result.data) {
  //     throw result;
  //   }
  //   return result.data;
  // }
}

//   // Song Collaborator Endpoints
//   @Post('song/:songId/contributions')
//   @UseGuards(SongOwnerGuard)
//   @ApiOperation({ summary: 'Add a contributor to a song' })
//   @ApiParam({ name: 'songId', type: String })
//   @SwaggerApiResponse({
//     status: HttpStatus.CREATED,
//     description: 'Contributor added successfully',
//     type: SongCollaboratorResponseDto,
//   })
//   async addContributor(
//     @Param('songId') songId: string,
//     @Body() createDto: CreateSongCollaboratorDto,
//   ): Promise<ApiResponse<SongCollaboratorResponseDto>> {
//     // Ensure songId from path matches DTO
//     createDto.songId = songId;
//     return this.songCollaboratorService.createContribution(createDto);
//   }

//   @Get('song/:songId/contributions')
//   @UseGuards(SongOwnerGuard)
//   @ApiOperation({ summary: 'Get all contributors for a song' })
//   @ApiParam({ name: 'songId', type: String })
//   @SwaggerApiResponse({
//     status: HttpStatus.OK,
//     description: 'Returns all song contributors',
//     type: [SongCollaboratorResponseDto],
//   })
//   async getSongContributors(
//     @Param('songId') songId: string,
//   ): Promise<ApiResponse<SongCollaboratorResponseDto[]>> {
//     return this.songCollaboratorService.findBySong(songId);
//   }

//   @Patch('song/:songId/contributions/:contributorId')
//   @UseGuards(SongOwnerGuard)
//   @ApiOperation({ summary: 'Update a contribution' })
//   @ApiParam({ name: 'songId', type: String, description: 'ID of the song' })
//   @ApiParam({
//     name: 'contributorId',
//     type: String,
//     description: 'ID of the contribution to update',
//   })
//   @SwaggerApiResponse({
//     status: HttpStatus.OK,
//     description: 'Contribution updated successfully',
//     type: SongCollaboratorResponseDto,
//   })
//   async updateContribution(
//     @Param('songId') songId: string,
//     @Param('contributorId') contributorId: string,
//     @Body() updateDto: UpdateSongCollaboratorDto,
//   ): Promise<ApiResponse<SongCollaboratorResponseDto>> {
//     // SongOwnerGuard will validate songId ownership
//     // Find the specific contribution using both IDs
//     return this.songCollaboratorService.updateContribution(
//       contributorId,
//       updateDto,
//     );
//   }

//   @Delete('contributions/:id')
//   @UseGuards(SongOwnerGuard)
//   @ApiOperation({ summary: 'Delete a contribution' })
//   @ApiParam({ name: 'id', type: String })
//   @SwaggerApiResponse({
//     status: HttpStatus.OK,
//     description: 'Contribution deleted successfully',
//   })
//   async deleteContribution(@Param('id') id: string): Promise<ApiResponse> {
//     return this.songCollaboratorService.deleteContribution(id);
//   }

//   @Get('song/:songId/contributions/role/:role')
//   @UseGuards(SongOwnerGuard)
//   @ApiOperation({ summary: 'Get song contributors by role' })
//   @ApiParam({ name: 'songId', type: String })
//   @ApiParam({ name: 'role', enum: CollaboratorRole })
//   @SwaggerApiResponse({
//     status: HttpStatus.OK,
//     description: 'Returns contributors for specific role',
//     type: [SongCollaboratorResponseDto],
//   })
//   async getSongContributorsByRole(
//     @Param('songId') songId: string,
//     @Param('role') role: CollaboratorRole,
//   ): Promise<ApiResponse<SongCollaboratorResponseDto[]>> {
//     return this.songCollaboratorService.findBySongAndRole(songId, role);
//   }
// }
