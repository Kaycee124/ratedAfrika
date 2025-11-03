import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
  ValidationPipe,
  UsePipes,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt/jwt.guard';
import {
  SubscriptionGuard,
  RequiredSubscriptions,
} from '../../auth/guards/subcription.guard';
import { ApiResponse, LinkSuggestion } from '../../common/types/apiresponse';
import { Sub_Plans } from '../../users/user.entity';
import { RatedFansService } from '../services/ratedfans.service';
import { LinkResolverService } from '../services/link-resolver.service';
import { PresaveService } from '../services/presave.service';
import {
  CreatePageDto,
  UpdatePageDto,
  PublishPageDto,
  BulkUpdateLinksDto,
  PageListQueryDto,
  PromoCardUploadDto,
} from '../dtos';

@ApiTags('RatedFans Dashboard')
@Controller('artist/ratedfans')
@UseGuards(JwtAuthGuard, SubscriptionGuard)
@RequiredSubscriptions(Sub_Plans.INDEPENDENT, Sub_Plans.PRO)
@ApiBearerAuth()
export class RatedFansDashboardController {
  constructor(
    private readonly ratedFansService: RatedFansService,
    private readonly linkResolverService: LinkResolverService,
    private readonly presaveService: PresaveService,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Create new RatedFans page',
    description:
      'Create a RatedFans page for distributed songs (with songId) or platform songs (without songId). Supports optional cover art, preview clips, and artist social media updates.',
  })
  @UsePipes(new ValidationPipe())
  async createPage(
    @Body() createPageDto: CreatePageDto,
    @Request() req: any,
  ): Promise<ApiResponse> {
    return await this.ratedFansService.createPage(createPageDto, req.user);
  }

  @Get()
  @ApiOperation({ summary: 'List my RatedFans pages' })
  @UsePipes(new ValidationPipe({ transform: true }))
  async getMyPages(
    @Query() query: PageListQueryDto,
    @Request() req: any,
  ): Promise<ApiResponse> {
    return await this.ratedFansService.getMyPages(req.user.id, query);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update RatedFans page' })
  @UsePipes(new ValidationPipe())
  async updatePage(
    @Param('id') pageId: string,
    @Body() updatePageDto: UpdatePageDto,
    @Request() req: any,
  ): Promise<ApiResponse> {
    // 2024-12-28: Added update endpoint for RatedFans pages
    return await this.ratedFansService.updatePage(
      pageId,
      updatePageDto,
      req.user,
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete RatedFans page' })
  async deletePage(
    @Param('id') pageId: string,
    @Request() req: any,
  ): Promise<ApiResponse> {
    // 2024-12-28: Added delete endpoint for RatedFans pages
    return await this.ratedFansService.deletePage(pageId, req.user);
  }

  @Put(':id/links')
  @ApiOperation({ summary: 'Manually add/edit platform links' })
  @UsePipes(new ValidationPipe())
  async updatePageLinks(
    @Param('id') pageId: string,
    @Body() updateLinksDto: BulkUpdateLinksDto,
    @Request() req: any,
  ): Promise<ApiResponse> {
    return await this.ratedFansService.updatePageLinks(
      pageId,
      updateLinksDto,
      req.user,
    );
  }

  @Post(':id/get-links-by-isrc')
  @ApiOperation({ summary: 'Auto-discover streaming links by ISRC' })
  async getLinksByISRC(
    @Param('id') pageId: string,
    @Request() req: any,
  ): Promise<LinkSuggestion[]> {
    return await this.linkResolverService.getLinksByPageId(pageId, req.user);
  }

  @Post(':id/publish')
  @ApiOperation({ summary: 'Publish/unpublish page' })
  @UsePipes(new ValidationPipe())
  async togglePagePublication(
    @Param('id') pageId: string,
    @Body() publishDto: PublishPageDto,
    @Request() req: any,
  ): Promise<ApiResponse> {
    return await this.ratedFansService.togglePagePublication(
      pageId,
      publishDto,
      req.user,
    );
  }

  @Get(':id/presave-stats')
  @ApiOperation({ summary: 'View presave campaign statistics' })
  async getPresaveStats(
    @Param('id') pageId: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    @Request() _req: any,
  ): Promise<ApiResponse> {
    return await this.presaveService.getPresaveStats(pageId);
  }

  @Post(':id/promos')
  @ApiOperation({ summary: 'Save promo card from frontend' })
  @UsePipes(new ValidationPipe())
  async savePromoCard(
    @Param('id') pageId: string,
    @Body() promoUploadDto: PromoCardUploadDto,
    @Request() req: any,
  ): Promise<ApiResponse> {
    return await this.ratedFansService.savePromoCard(
      pageId,
      promoUploadDto,
      req.user,
    );
  }

  @Get(':id/promos')
  @ApiOperation({ summary: 'List saved promo cards' })
  async getPromoCards(
    @Param('id') pageId: string,
    @Request() req: any,
  ): Promise<ApiResponse> {
    return await this.ratedFansService.getPromoCards(pageId, req.user);
  }
}
