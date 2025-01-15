// src/collaborators/controllers/collaborators.controller.ts
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
import { CollaboratorsService } from './collaborators.service';
import { CreateCollaboratorDto } from './dto/collaborator.dto';
import { UpdateCollaboratorDto } from './dto/collaborator.dto';
import { CreateSplitDto } from './dto/collaborator.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt/jwt.guard';
import {
  SubscriptionGuard,
  RequiredSubscriptions,
} from 'src/auth/guards/subcription.guard';
import { Sub_Plans } from 'src/users/user.entity';
import { Collaborator } from './entities/collaborator.entity';
import { CollaboratorSplit } from './entities/collaborator-split.entity';

interface ApiResponse<T = any> {
  statusCode: number;
  message: string;
  data?: T;
}

@ApiTags('collaborators')
@Controller('collaborators')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CollaboratorsController {
  constructor(private readonly collaboratorsService: CollaboratorsService) {}

  @Post()
  @UseGuards(SubscriptionGuard)
  @RequiredSubscriptions(Sub_Plans.ARTIST, Sub_Plans.LABEL)
  @ApiOperation({ summary: 'Create a new collaborator' })
  @SwaggerApiResponse({
    status: HttpStatus.CREATED,
    description: 'Collaborator created successfully',
  })
  @SwaggerApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Email already exists',
  })
  @SwaggerApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient subscription plan',
  })
  async create(
    @Body() createCollaboratorDto: CreateCollaboratorDto,
  ): Promise<ApiResponse<Collaborator>> {
    return await this.collaboratorsService.create(createCollaboratorDto);
  }

  @Get()
  @UseGuards(SubscriptionGuard)
  @RequiredSubscriptions(Sub_Plans.ARTIST, Sub_Plans.LABEL)
  @ApiOperation({ summary: 'Get all collaborators' })
  @SwaggerApiResponse({
    status: HttpStatus.OK,
    description: 'Collaborators retrieved successfully',
  })
  async findAll(): Promise<ApiResponse<Collaborator[]>> {
    return await this.collaboratorsService.findAll();
  }

  @Get(':id')
  @UseGuards(SubscriptionGuard)
  @RequiredSubscriptions(Sub_Plans.ARTIST, Sub_Plans.LABEL)
  @ApiOperation({ summary: 'Get a collaborator by ID' })
  @ApiParam({ name: 'id', type: String, description: 'Collaborator ID' })
  @SwaggerApiResponse({
    status: HttpStatus.OK,
    description: 'Collaborator retrieved successfully',
  })
  @SwaggerApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Collaborator not found',
  })
  async findOne(@Param('id') id: string): Promise<ApiResponse<Collaborator>> {
    return await this.collaboratorsService.findOne(id);
  }

  @Post('splits')
  @UseGuards(SubscriptionGuard)
  @RequiredSubscriptions(Sub_Plans.ARTIST, Sub_Plans.LABEL)
  @ApiOperation({ summary: 'Create a new split' })
  @SwaggerApiResponse({
    status: HttpStatus.CREATED,
    description: 'Split created successfully',
  })
  @SwaggerApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid split percentage',
  })
  async createSplit(
    @Body() createSplitDto: CreateSplitDto,
  ): Promise<ApiResponse<CollaboratorSplit>> {
    return await this.collaboratorsService.createSplit(createSplitDto);
  }

  @Get('splits/:songId')
  @UseGuards(SubscriptionGuard)
  @RequiredSubscriptions(Sub_Plans.ARTIST, Sub_Plans.LABEL)
  @ApiOperation({ summary: 'Get splits for a song' })
  @ApiParam({ name: 'songId', type: String, description: 'Song ID' })
  @SwaggerApiResponse({
    status: HttpStatus.OK,
    description: 'Splits retrieved successfully',
  })
  async getSplits(
    @Param('songId') songId: string,
  ): Promise<ApiResponse<CollaboratorSplit[]>> {
    return await this.collaboratorsService.getSplits(songId);
  }

  @Patch(':id')
  @UseGuards(SubscriptionGuard)
  @RequiredSubscriptions(Sub_Plans.LABEL)
  @ApiOperation({ summary: 'Update a collaborator' })
  @ApiParam({ name: 'id', type: String, description: 'Collaborator ID' })
  @SwaggerApiResponse({
    status: HttpStatus.OK,
    description: 'Collaborator updated successfully',
  })
  async update(
    @Param('id') id: string,
    @Body() updateCollaboratorDto: UpdateCollaboratorDto,
  ): Promise<ApiResponse<Collaborator>> {
    return await this.collaboratorsService.update(id, updateCollaboratorDto);
  }

  @Post(':id/verify')
  @UseGuards(SubscriptionGuard)
  @RequiredSubscriptions(Sub_Plans.LABEL)
  @ApiOperation({ summary: 'Verify a collaborator' })
  @ApiParam({ name: 'id', type: String, description: 'Collaborator ID' })
  @SwaggerApiResponse({
    status: HttpStatus.OK,
    description: 'Collaborator verified successfully',
  })
  async verifyCollaborator(
    @Param('id') id: string,
  ): Promise<ApiResponse<Collaborator>> {
    return await this.collaboratorsService.verifyCollaborator(id);
  }

  @Delete('splits/:id')
  @UseGuards(SubscriptionGuard)
  @RequiredSubscriptions(Sub_Plans.LABEL)
  @ApiOperation({ summary: 'Delete a split' })
  @ApiParam({ name: 'id', type: String, description: 'Split ID' })
  @SwaggerApiResponse({
    status: HttpStatus.OK,
    description: 'Split deleted successfully',
  })
  async removeSplit(@Param('id') id: string): Promise<ApiResponse> {
    return await this.collaboratorsService.removeSplit(id);
  }
}
