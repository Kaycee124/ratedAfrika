import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  UseGuards,
  Request,
  Query,
  ParseUUIDPipe,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { SplitSheetService } from './splitsheet.service';
import {
  CreateSplitSheetDto,
  UpdateSplitSheetDto,
} from './dto/collaborator.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt/jwt.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { SplitSheet } from './entities/splitsheet.entity';
import { SplitSheetEntry } from './entities/SplitSheetEntry.entity';

@ApiTags('Split Sheets')
@Controller('split-sheets')
export class SplitSheetController {
  constructor(private readonly splitSheetService: SplitSheetService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async createSplitSheet(
    @Body() createSplitSheetDto: CreateSplitSheetDto,
    @Request() req,
  ): Promise<SplitSheet> {
    try {
      return await this.splitSheetService.createSplitSheet(
        createSplitSheetDto,
        req.user.id,
      );
    } catch (error) {
      // Log the error for debugging
      console.error('Error in createSplitSheet controller:', error);

      // Rethrow HttpExceptions as they are
      if (error instanceof HttpException) {
        throw error;
      }

      // For other errors, wrap them in a meaningful HttpException
      throw new HttpException(
        error.message || 'Failed to create split sheet',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a split sheet by ID' })
  @ApiParam({ name: 'id', description: 'Split sheet ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns the split sheet',
    type: SplitSheet,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Split sheet not found',
  })
  async getSplitSheet(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<SplitSheet> {
    return this.splitSheetService.getSplitSheet(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  //... other decorators
  async updateSplitSheet(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateSplitSheetDto: UpdateSplitSheetDto,
    @Request() req,
  ): Promise<SplitSheet> {
    return this.splitSheetService.updateSplitSheet(
      id,
      updateSplitSheetDto,
      req.user.id,
    ); // Pass userId
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get split sheets by user ID or email' })
  @ApiQuery({
    name: 'userId',
    required: false,
    description: 'User ID to filter splits by',
  })
  @ApiQuery({
    name: 'email',
    required: false,
    description: 'Email to filter splits by',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns the split sheet entries',
    type: [SplitSheetEntry],
  })
  async getSplitSheets(
    @Query('userId') userId?: string,
    @Query('email') email?: string,
    @Request() req?: any,
  ): Promise<SplitSheetEntry[]> {
    if (userId) {
      return this.splitSheetService.getUserSplits(userId);
    } else if (email) {
      return this.splitSheetService.findAllSplitsByEmail(email);
    } else {
      // Default to current user's splits if no query params
      return this.splitSheetService.getUserSplits(req.user.id);
    }
  }

  @Get(':id/entries')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all entries for a split sheet' })
  @ApiParam({ name: 'id', description: 'Split sheet ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns the split sheet entries',
    type: [SplitSheetEntry],
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Split sheet not found',
  })
  async getSplitSheetEntries(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<SplitSheetEntry[]> {
    return this.splitSheetService.getSplitSheetEntries(id);
  }

  @Post('claim/:encryptedEntryId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Claim a split sheet entry' })
  @ApiParam({
    name: 'encryptedEntryId',
    description: 'Encrypted entry ID from claim link',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Split entry successfully claimed',
    type: SplitSheetEntry,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Split entry not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Entry already claimed or profile incomplete',
  })
  async claimSplitEntry(
    @Param('encryptedEntryId') encryptedEntryId: string,
    @Request() req,
  ): Promise<SplitSheetEntry> {
    return this.splitSheetService.claimSplitEntry(
      encryptedEntryId,
      req.user.id,
    );
  }

  @Get('calculate-split')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Calculate split amount based on percentage' })
  @ApiQuery({ name: 'amount', description: 'Total amount to split' })
  @ApiQuery({ name: 'percentage', description: 'Percentage of the split' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns the calculated split amount',
  })
  async calculateSplitAmount(
    @Query('amount') amount: number,
    @Query('percentage') percentage: number,
  ): Promise<{ amount: number }> {
    const splitAmount = await this.splitSheetService.calculateSplitAmount(
      amount,
      percentage,
    );
    return { amount: splitAmount };
  }
}
