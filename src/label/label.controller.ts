// src/labels/labels.controller.ts
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
} from '@nestjs/swagger';
import { LabelsService } from './label.service';
import { CreateLabelDto } from './dto/label.dto';
import { UpdateLabelDto } from './dto/label.dto';
import { QueryLabelDto } from './dto/label.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt/jwt.guard';
import {
  SubscriptionGuard,
  RequiredSubscriptions,
} from 'src/auth/guards/subcription.guard';
import { Sub_Plans } from '../users/user.entity';
import { Label } from './label.entity';

interface ApiResponse<T = any> {
  statusCode: number;
  message: string;
  data?: T;
}

@ApiTags('labels')
@Controller('labels')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class LabelsController {
  constructor(private readonly labelsService: LabelsService) {}

  @Post('create')
  @UseGuards(SubscriptionGuard)
  @RequiredSubscriptions(Sub_Plans.LABEL)
  @ApiOperation({ summary: 'Create a new label profile' })
  @SwaggerApiResponse({
    status: HttpStatus.CREATED,
    description: 'Label profile created successfully',
  })
  async create(
    @Body() createLabelDto: CreateLabelDto,
    @Request() req,
  ): Promise<ApiResponse<Label>> {
    return await this.labelsService.create(createLabelDto, req.user);
  }

  @Get()
  @ApiOperation({ summary: 'Get all label profiles' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'genre', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  async findAll(@Query() queryDto: QueryLabelDto): Promise<
    ApiResponse<{
      labels: Label[];
      meta: { total: number; page: number; limit: number; totalPages: number };
    }>
  > {
    return await this.labelsService.findAll(queryDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a label profile by ID' })
  @ApiParam({ name: 'id', type: String })
  async findOne(@Param('id') id: string): Promise<ApiResponse<Label>> {
    return await this.labelsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(SubscriptionGuard)
  @RequiredSubscriptions(Sub_Plans.LABEL)
  @ApiOperation({ summary: 'Update a label profile' })
  @ApiParam({ name: 'id', type: String })
  async update(
    @Param('id') id: string,
    @Body() updateLabelDto: UpdateLabelDto,
    @Request() req,
  ): Promise<ApiResponse<Label>> {
    return await this.labelsService.update(id, updateLabelDto, req.user);
  }

  @Delete(':id')
  @UseGuards(SubscriptionGuard)
  @RequiredSubscriptions(Sub_Plans.LABEL)
  @ApiOperation({ summary: 'Delete a label profile' })
  @ApiParam({ name: 'id', type: String })
  async remove(@Param('id') id: string, @Request() req): Promise<ApiResponse> {
    return await this.labelsService.remove(id, req.user);
  }

  @Post(':labelId/roster/:artistId')
  @UseGuards(SubscriptionGuard)
  @RequiredSubscriptions(Sub_Plans.LABEL)
  @ApiOperation({ summary: 'Add an artist to label roster' })
  @ApiParam({ name: 'labelId', type: String })
  @ApiParam({ name: 'artistId', type: String })
  async addArtistToRoster(
    @Param('labelId') labelId: string,
    @Param('artistId') artistId: string,
    @Request() req,
  ): Promise<ApiResponse> {
    return await this.labelsService.addArtistToRoster(
      labelId,
      artistId,
      req.user,
    );
  }

  @Delete(':labelId/roster/:artistId')
  @UseGuards(SubscriptionGuard)
  @RequiredSubscriptions(Sub_Plans.LABEL)
  @ApiOperation({ summary: 'Remove an artist from label roster' })
  @ApiParam({ name: 'labelId', type: String })
  @ApiParam({ name: 'artistId', type: String })
  async removeArtistFromRoster(
    @Param('labelId') labelId: string,
    @Param('artistId') artistId: string,
    @Request() req,
  ): Promise<ApiResponse> {
    return await this.labelsService.removeArtistFromRoster(
      labelId,
      artistId,
      req.user,
    );
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get all label profiles for a user' })
  @ApiParam({ name: 'userId', type: String })
  async findByUser(
    @Param('userId') userId: string,
  ): Promise<ApiResponse<Label[]>> {
    return await this.labelsService.findByUser(userId);
  }
}
