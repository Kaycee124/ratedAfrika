import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseUUIDPipe,
  Req,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CollaboratorService } from './collaborators.service';
import {
  CreateCollaboratorDto,
  UpdateCollaboratorDto,
} from './dto/collaborator.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt/jwt.guard';

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
  constructor(private readonly collaboratorService: CollaboratorService) {}

  // Add a credit to a song
  @Post(':songId/collaborators')
  async addCredit(
    @Param('songId', ParseUUIDPipe) songId: string,
    @Body() createDto: CreateCollaboratorDto,
    @Req() req: any,
  ): Promise<ApiResponse> {
    // UPDATE THIS LINE:
    return this.collaboratorService.addSongCredit(
      createDto,
      songId,
      req.user.id,
    );
  }

  // Get all credits for a song
  @Get(':songId/collaborators')
  async getSongCredits(
    @Param('songId', ParseUUIDPipe) songId: string,
  ): Promise<ApiResponse> {
    return this.collaboratorService.getSongCredits(songId);
  }

  // Get credits by role for a song
  @Get(':songId/collaborators/role/:role')
  async getSongCreditsByRole(
    @Param('songId', ParseUUIDPipe) songId: string,
    @Param('role') role: CollaboratorRole, // Use the enum for validation
  ): Promise<ApiResponse> {
    return this.collaboratorService.getSongCreditsByRole(songId, role);
  }

  // Update a specific credit
  @Patch(':songId/collaborators/:creditId')
  async updateCredit(
    @Param('songId', ParseUUIDPipe) songId: string,
    @Param('creditId', ParseUUIDPipe) creditId: string,
    @Body() updateDto: UpdateCollaboratorDto,
    @Req() req: any, // 1. Add Req to get user
  ): Promise<ApiResponse> {
    // Ensure songId stays the same
    updateDto.songId = songId;
    //NEW CHANGE : November 11, 2025 at 07:30 AM
    return this.collaboratorService.updateCredit(
      creditId,
      updateDto,
      req.user.id,
    ); // 2. Pass user ID
  }

  // Remove a credit from a song
  @Delete(':songId/collaborators/:creditId')
  async removeCredit(
    @Param('songId', ParseUUIDPipe) songId: string,
    @Param('creditId', ParseUUIDPipe) creditId: string,
    //NEW CHANGE : November 11, 2025 at 07:30 AM
    @Req() req: any, // 1. Add Req to get user
  ): Promise<ApiResponse> {
    //NEW CHANGE : November 11, 2025 at 07:30 AM
    return this.collaboratorService.removeCredit(creditId, req.user.id); // 2. Pass user ID
  }
}

// Additional search endpoints (not song-specific)
@ApiTags('collaborators-search')
@Controller('collaborators')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CollaboratorSearchController {
  constructor(private readonly collaboratorService: CollaboratorService) {}

  // Find all songs a person worked on by email
  @Get('search')
  async searchByEmail(@Query('email') email: string): Promise<ApiResponse> {
    if (!email) {
      return {
        statusCode: 400,
        message: 'Email query parameter is required',
      };
    }
    return this.collaboratorService.findCollaborationsByEmail(email);
  }

  // Get a specific credit by ID
  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<ApiResponse> {
    return this.collaboratorService.findOne(id);
  }

  // Get all credits created by the logged-in user
  @Get('user/me')
  async getMyCredits(@Req() req: any): Promise<ApiResponse> {
    return this.collaboratorService.findCreditsByUser(req.user.id);
  }

  // Get credits by specific user ID
  @Get('user/:userId')
  async getUserCredits(
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<ApiResponse> {
    return this.collaboratorService.findCreditsByUser(userId);
  }
}
