/*****************************THE NEW CONTROLLER
 */
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
import { SplitSheetService, ApiResponse } from './splitsheet.service';
import {
  CreateSplitSheetDto,
  UpdateSplitSheetDto,
  ClaimSplitEntryDto,
} from './dto/collaborator.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt/jwt.guard';
import { ApiTags } from '@nestjs/swagger';
import { SplitSheet } from './entities/splitsheet.entity';
import { SplitSheetEntry } from './entities/splitsheetEntry.entity';

@ApiTags('Split Sheets')
@Controller('split-sheets')
export class SplitSheetController {
  constructor(private readonly splitSheetService: SplitSheetService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async createSplitSheet(
    @Body() createSplitSheetDto: CreateSplitSheetDto,
    @Request() req,
  ): Promise<ApiResponse<SplitSheet>> {
    try {
      const response = await this.splitSheetService.createSplitSheet(
        createSplitSheetDto,
        req.user.id,
      );

      if (response.statusCode !== HttpStatus.CREATED) {
        throw new HttpException(
          {
            statusCode: response.statusCode,
            message: response.message,
            timestamp: new Date().toISOString(),
            path: req.url,
          },
          response.statusCode,
        );
      }

      return response;
    } catch (error) {
      throw new HttpException(
        {
          statusCode: error.status || HttpStatus.INTERNAL_SERVER_ERROR,
          message:
            error.response?.message || error.message || 'An error occurred',
          timestamp: new Date().toISOString(),
          path: req.url,
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getSplitSheet(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiResponse<SplitSheet>> {
    try {
      return await this.splitSheetService.getSplitSheet(id);
    } catch (error) {
      throw new HttpException(
        {
          statusCode: error.status || HttpStatus.INTERNAL_SERVER_ERROR,
          message:
            error.response?.message || error.message || 'An error occurred',
          timestamp: new Date().toISOString(),
          path: `/split-sheets/${id}`,
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async updateSplitSheet(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateSplitSheetDto: UpdateSplitSheetDto,
    @Request() req,
  ): Promise<ApiResponse<SplitSheet>> {
    try {
      return await this.splitSheetService.updateSplitSheet(
        id,
        updateSplitSheetDto,
        req.user.id,
      );
    } catch (error) {
      throw new HttpException(
        {
          statusCode: error.status || HttpStatus.INTERNAL_SERVER_ERROR,
          message:
            error.response?.message || error.message || 'An error occurred',
          timestamp: new Date().toISOString(),
          path: `/split-sheets/${id}`,
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async getSplitSheets(
    @Request() req,
    @Query('userId') userId?: string,
    @Query('email') email?: string,
  ): Promise<ApiResponse<SplitSheetEntry[]>> {
    try {
      if (userId) {
        return await this.splitSheetService.getUserSplits(userId);
      } else if (email) {
        return await this.splitSheetService.findAllSplitsByEmail(email);
      } else {
        return await this.splitSheetService.getUserSplits(req.user.id);
      }
    } catch (error) {
      throw new HttpException(
        {
          statusCode: error.status || HttpStatus.INTERNAL_SERVER_ERROR,
          message:
            error.response?.message || error.message || 'An error occurred',
          timestamp: new Date().toISOString(),
          path: req.url,
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id/entries')
  @UseGuards(JwtAuthGuard)
  async getSplitSheetEntries(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiResponse<SplitSheetEntry[]>> {
    try {
      return await this.splitSheetService.getSplitSheetEntries(id);
    } catch (error) {
      throw new HttpException(
        {
          statusCode: error.status || HttpStatus.INTERNAL_SERVER_ERROR,
          message:
            error.response?.message || error.message || 'An error occurred',
          timestamp: new Date().toISOString(),
          path: `/split-sheets/${id}/entries`,
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('claim')
  @UseGuards(JwtAuthGuard)
  async claimSplitEntry(
    @Body() claimDto: ClaimSplitEntryDto,
    @Request() req,
  ): Promise<ApiResponse<SplitSheetEntry>> {
    try {
      return await this.splitSheetService.claimSplitEntry(
        claimDto,
        req.user.id,
      );
    } catch (error) {
      throw new HttpException(
        {
          statusCode: error.status || HttpStatus.INTERNAL_SERVER_ERROR,
          message:
            error.response?.message || error.message || 'An error occurred',
          timestamp: new Date().toISOString(),
          path: '/split-sheets/claim',
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('verify/:claimToken')
  async verifyClaimToken(
    @Param('claimToken') claimToken: string,
  ): Promise<ApiResponse<{ isValid: boolean; entryDetails?: any }>> {
    try {
      return await this.splitSheetService.verifyClaimToken(claimToken);
    } catch (error) {
      throw new HttpException(
        {
          statusCode: error.status || HttpStatus.INTERNAL_SERVER_ERROR,
          message:
            error.response?.message || error.message || 'An error occurred',
          timestamp: new Date().toISOString(),
          path: `/split-sheets/verify/${claimToken}`,
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('resend-claim/:entryId')
  @UseGuards(JwtAuthGuard)
  async resendClaimEmail(
    @Param('entryId', ParseUUIDPipe) entryId: string,
    @Request() req,
  ): Promise<ApiResponse<{ sent: boolean }>> {
    try {
      return await this.splitSheetService.resendClaimEmail(
        entryId,
        req.user.id,
      );
    } catch (error) {
      throw new HttpException(
        {
          statusCode: error.status || HttpStatus.INTERNAL_SERVER_ERROR,
          message:
            error.response?.message || error.message || 'An error occurred',
          timestamp: new Date().toISOString(),
          path: `/split-sheets/resend-claim/${entryId}`,
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('calculate-split')
  @UseGuards(JwtAuthGuard)
  async calculateSplitAmount(
    @Query('amount') amount: number,
    @Query('percentage') percentage: number,
  ): Promise<{ amount: number }> {
    try {
      const splitAmount = await this.splitSheetService.calculateSplitAmount(
        amount,
        percentage,
      );
      return { amount: splitAmount };
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: error.message || 'An error occurred',
          timestamp: new Date().toISOString(),
          path: '/split-sheets/calculate-split',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
