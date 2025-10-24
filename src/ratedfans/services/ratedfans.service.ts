/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Injectable,
  Logger,
  HttpStatus,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  HttpException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Response } from 'express';
import { RatedFansPage } from '../entities/ratedfans-page.entity';
import { RatedFansLink } from '../entities/ratedfans-link.entity';
import { PromoCard } from '../entities/promo-card.entity';
import { Artist } from '../../artists/entities/artist.entity';
import { Song } from '../../songs/entities/song.entity';
import { User } from '../../users/user.entity';
import { StorageService } from '../../storage/services/storage.service';
import { SongsService } from '../../songs/songs.service'; // 2024-09-22: change: import for cover art path resolution
import { PresaveService } from './presave.service'; // 2024-09-22: change: import for presave stats integration
import {
  CreatePageDto,
  PublishPageDto,
  BulkUpdateLinksDto,
  PageListQueryDto,
  PromoCardUploadDto,
  RedirectQueryDto,
  PageListItemDto,
  PublicPageResponseDto,
  DashboardPageResponseDto,
  PageLinkDto,
  PromoCardResponseDto,
} from '../dtos';
import { ApiResponse } from '../../common/types/apiresponse';

@Injectable()
export class RatedFansService {
  private readonly logger = new Logger(RatedFansService.name);

  constructor(
    @InjectRepository(RatedFansPage)
    private readonly pageRepository: Repository<RatedFansPage>,
    @InjectRepository(RatedFansLink)
    private readonly linkRepository: Repository<RatedFansLink>,
    @InjectRepository(PromoCard)
    private readonly promoCardRepository: Repository<PromoCard>,
    @InjectRepository(Artist)
    private readonly artistRepository: Repository<Artist>,
    @InjectRepository(Song)
    private readonly songRepository: Repository<Song>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly storageService: StorageService,
    private readonly songsService: SongsService,
    private readonly presaveService: PresaveService, // 2024-09-22: change: inject for presave stats
  ) {}

  /**
   * Creates a new RatedFans page for a song
   *
   * Process:
   * 1. Validate that the song exists and user owns it (via artist relationship)
   * 2. Check if a page already exists for this song
   * 3. Generate unique slug (artist-song-title format)
   * 4. Create and save the page
   * 5. Return complete page data
   */

  async createPage(
    createPageDto: CreatePageDto,
    user: User,
  ): Promise<ApiResponse<DashboardPageResponseDto>> {
    this.logger.log(
      `Creating RatedFans page "${createPageDto.releaseTitle}" by user ${user.id}`,
    );

    if (!createPageDto.artistName?.trim()) {
      throw new HttpException(
        'Artist name is required',
        HttpStatus.BAD_REQUEST,
      );
    }

    let song: Song | null = null;
    let artist: Artist;

    // Step 1: Handle distributed songs (with songId) vs platform songs (without songId)
    if (createPageDto.songId) {
      // Distributed song - validate song exists and user owns it
      song = await this.songRepository.findOne({
        where: { id: createPageDto.songId },
        relations: ['primaryArtist', 'primaryArtist.user'],
      });

      if (!song) {
        throw new HttpException('Song not found', HttpStatus.NOT_FOUND);
      }

      // Get user's artist profiles to validate ownership
      const userWithArtists = await this.userRepository.findOne({
        where: { id: user.id },
        relations: ['artistProfiles'],
      });

      const userArtistIds =
        userWithArtists?.artistProfiles?.map((a) => a.id) || [];

      // Validate user owns the song through upload or artist relationship
      if (
        song.uploadedById !== user.id &&
        !userArtistIds.includes(song.primaryArtist?.id)
      ) {
        throw new HttpException(
          'You do not have permission to create a page for this song',
          HttpStatus.FORBIDDEN,
        );
      }

      // Check if page already exists for this song
      const existingPage = await this.pageRepository.findOne({
        where: { songId: createPageDto.songId },
      });

      if (existingPage) {
        throw new HttpException(
          'A RatedFans page already exists for this song',
          HttpStatus.CONFLICT,
        );
      }

      artist = song.primaryArtist;
    } else {
      // Platform song - get user's first artist profile
      const userWithArtists = await this.userRepository.findOne({
        where: { id: user.id },
        relations: ['artistProfiles'],
      });

      if (!userWithArtists?.artistProfiles?.length) {
        throw new HttpException(
          'You must have an artist profile to create a RatedFans page',
          HttpStatus.BAD_REQUEST,
        );
      }

      if (createPageDto.releaseDate) {
        const releaseDate = new Date(createPageDto.releaseDate);
        const now = new Date();

        if (releaseDate < now) {
          throw new HttpException(
            'Release date cannot be in the past',
            HttpStatus.BAD_REQUEST,
          );
        }
      }

      artist = userWithArtists.artistProfiles[0];
    }

    // Step 2: Update artist social media if provided
    if (createPageDto.artistSocialMediaLinks) {
      artist.socialMediaLinks = {
        ...artist.socialMediaLinks,
        ...createPageDto.artistSocialMediaLinks,
      };
      await this.artistRepository.save(artist);
    }

    // Step 3: Generate and validate slug
    let slug = createPageDto.customSlug;
    if (!slug) {
      const slugSource = song ? song.title : createPageDto.releaseTitle;
      slug = this.generateSlug(artist.name, slugSource);
    }

    // Check if slug already exists - reject duplicates
    const existingPage = await this.pageRepository.findOne({ where: { slug } });
    if (existingPage) {
      throw new HttpException(
        `Slug "${slug}" is already taken. Please choose a different custom slug.`,
        HttpStatus.CONFLICT,
      );
    }

    // Step 4: Create the page
    const newPage = this.pageRepository.create({
      releaseTitle: createPageDto.releaseTitle,
      artistName: createPageDto.artistName,
      slug,
      songId: song?.id || null, // Null for platform songs
      artistId: artist.id,
      isPresaveEnabled: createPageDto.isPresaveEnabled || false,
      releaseDate:
        createPageDto.releaseDate || song?.proposedReleaseDate || null,
      releaseType: createPageDto.releaseType,
      socialMediaLinks: createPageDto.socialMediaLinks,
      previewClips: createPageDto.previewClips,
      coverArtLink: createPageDto.coverArtLink,
      isPublished: false, // New pages start as drafts
    });

    const savedPage = await this.pageRepository.save(newPage);

    // Step 5: Return complete page data with relationships
    // 2025-01-23 00:13: Include featured artists relations for contributors
    const pageWithRelations = await this.pageRepository.findOne({
      where: { id: savedPage.id },
      relations: ['artist', 'song', 'links'],
    });

    const pageType = song ? 'distributed song' : 'platform song';
    return {
      statusCode: HttpStatus.CREATED,
      message: `RatedFans page created successfully`,
      data: await this.transformToDashboardResponse(pageWithRelations),
    };
  }

  /**
   * Retrieves a published RatedFans page by slug for public viewing
   *
   * Process:
   * 1. Find page by slug with all necessary relationships
   * 2. Check if page exists
   * 3. Verify page is published (only show published pages to public)
   * 4. Return appropriate error if page doesn't exist or isn't published
   * 5. Transform to public response format (hiding sensitive data)
   * 6. Include active streaming links and artist social data
   */
  async findPageBySlug(
    slug: string,
  ): Promise<ApiResponse<PublicPageResponseDto>> {
    this.logger.log(`Retrieving page by slug: ${slug}`);

    // Find page without isPublished filter to check existence first
    const page = await this.pageRepository.findOne({
      where: {
        slug,
      },
      relations: ['artist', 'song', 'links'],
    });

    // Page doesn't exist at all
    if (!page) {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Page not found',
      };
    }

    // Page exists but is not published
    if (!page.isPublished) {
      return {
        statusCode: HttpStatus.FORBIDDEN,
        message: 'This page is not published yet',
      };
    }

    // Page is published, return full details
    const publicResponse = await this.transformToPublicResponse(page);

    return {
      statusCode: HttpStatus.OK,
      message: 'Page retrieved successfully',
      data: publicResponse,
    };
  }

  /**
   * Gets active streaming links for a page by slug (public endpoint)
   */
  async getPageLinks(slug: string): Promise<ApiResponse<PageLinkDto[]>> {
    // Find published page and get active links
    const page = await this.pageRepository.findOne({
      where: { slug, isPublished: true },
      relations: ['links'],
    });

    if (!page) {
      throw new HttpException('Page not found', HttpStatus.NOT_FOUND);
    }

    // Filter and sort active links
    const activeLinks = page.links
      .filter((link) => link.isActive)
      .sort((a, b) => {
        // Primary links first, then by display order
        if (a.isPrimary && !b.isPrimary) return -1;
        if (!a.isPrimary && b.isPrimary) return 1;
        return (a.displayOrder || 99) - (b.displayOrder || 99);
      })
      .map((link) => ({
        id: link.id,
        platform: link.platform,
        url: link.url,
        isPrimary: link.isPrimary,
        displayOrder: link.displayOrder,
      }));

    return {
      statusCode: HttpStatus.OK,
      message: 'Links retrieved successfully',
      data: activeLinks,
    };
  }

  /**
   * Handles platform redirect with click tracking
   */
  async redirectToPlatform(
    slug: string,
    query: RedirectQueryDto,
    res: Response,
  ): Promise<void> {
    // Find the page and specific platform link
    const page = await this.pageRepository.findOne({
      where: { slug, isPublished: true },
      relations: ['links'],
    });

    if (!page) {
      throw new HttpException('Page not found', HttpStatus.NOT_FOUND);
    }

    // Find the specific platform link
    const platformLink = page.links.find(
      (link) => link.platform === query.platform && link.isActive,
    );

    if (!platformLink) {
      throw new HttpException('Platform link not found', HttpStatus.NOT_FOUND);
    }

    // TODO: Add click tracking here when analytics are implemented
    this.logger.log(`Redirecting to ${query.platform} for page ${slug}`);

    // Perform redirect
    res.redirect(302, platformLink.url);
  }

  /**
   * Gets artist's pages with pagination and filtering
   */
  async getMyPages(
    userId: string,
    query: PageListQueryDto,
  ): Promise<ApiResponse<PageListItemDto[]>> {
    this.logger.log(`Getting pages for user ${userId}`);

    // Parse pagination parameters
    const page = query.page || 1;
    const limit = Math.min(query.limit || 10, 100); // Cap at 100
    const skip = (page - 1) * limit;

    // Build query for user's pages through artist relationship
    const queryBuilder = this.pageRepository
      .createQueryBuilder('page')
      .leftJoinAndSelect('page.artist', 'artist')
      .leftJoinAndSelect('page.song', 'song')
      .leftJoinAndSelect('page.links', 'links')
      .leftJoinAndSelect('page.presaveSignups', 'presaveSignups')
      .where('artist.user.id = :userId', { userId })
      .skip(skip)
      .take(limit);

    // Add search filter if provided
    if (query.search) {
      queryBuilder.andWhere(
        '(LOWER(page.title) LIKE LOWER(:search) OR LOWER(song.title) LIKE LOWER(:search))',
        { search: `%${query.search}%` },
      );
    }

    // Add status filter
    if (query.status === 'published') {
      queryBuilder.andWhere('page.isPublished = :published', {
        published: true,
      });
    } else if (query.status === 'draft') {
      queryBuilder.andWhere('page.isPublished = :published', {
        published: false,
      });
    }

    // Add sorting
    const sortField = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder || 'DESC';
    queryBuilder.orderBy(`page.${sortField}`, sortOrder);

    // Execute query
    const [pages, total] = await queryBuilder.getManyAndCount();

    // Transform to list items
    const baseUrl = process.env.API_BASE_URL || 'http://localhost:3000';
    const listItems: PageListItemDto[] = pages.map((page) => ({
      id: page.id,
      slug: page.slug,
      pageUrl: `${baseUrl}/r/${page.slug}`,
      releaseTitle: page.releaseTitle,
      isPublished: page.isPublished,
      isPresaveEnabled: page.isPresaveEnabled,
      createdAt: page.createdAt,
      updatedAt: page.updatedAt,
      songTitle: page.song?.title || page.releaseTitle || 'Your Release', // Provide a fallback
      artistName: page.artist?.name || 'RatedFans Artist',
      coverArtPath: page.coverArtLink?.url || null, // 2025-10-24: added cover art path from page
      totalLinks: page.links?.length || 0,
      totalPresaves: page.presaveSignups?.length || 0,
    }));

    return {
      statusCode: HttpStatus.OK,
      message: 'Pages retrieved successfully',
      data: listItems,
    };
  }

  /**
   * Updates streaming platform links for a page (bulk operation)
   * Process:
   * 1. Validate user owns the page
   * 2. If replaceExisting=true, remove existing links
   * 3. Validate no platform duplicates in new links
   * 4. Create new link records
   * 5. Return updated page with links
   */
  async updatePageLinks(
    pageId: string,
    updateLinksDto: BulkUpdateLinksDto,
    user: User,
  ): Promise<ApiResponse<PageLinkDto[]>> {
    this.logger.log(
      `Updating links for page ${pageId} with ${updateLinksDto.links.length} links`,
    );

    // Step 1: Validate page exists and user owns it
    const page = await this.pageRepository.findOne({
      where: { id: pageId },
      relations: ['artist', 'artist.user', 'links'],
    });

    if (!page) {
      throw new HttpException('Page not found', HttpStatus.NOT_FOUND);
    }

    if (page.artist?.user?.id !== user.id) {
      throw new HttpException(
        'You can only update links for your own pages',
        HttpStatus.FORBIDDEN,
      );
    }

    // Step 2: Validate no platform duplicates in new links
    const platforms = updateLinksDto.links.map((link) => link.platform);
    const duplicates = platforms.filter(
      (platform, index) => platforms.indexOf(platform) !== index,
    );

    if (duplicates.length > 0) {
      throw new HttpException(
        `Duplicate platforms found: ${duplicates.join(', ')}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    // Step 3: Handle existing links
    if (updateLinksDto.replaceExisting) {
      // Remove all existing links for this page
      await this.linkRepository.delete({ pageId });
      this.logger.log(`Removed existing links for page ${pageId}`);
    } else {
      // Remove only links for platforms being updated
      const platformsToUpdate = updateLinksDto.links.map(
        (link) => link.platform,
      );
      if (platformsToUpdate.length > 0) {
        await this.linkRepository.delete({
          pageId,
          platform: In(platformsToUpdate),
        });
        this.logger.log(
          `Updated existing links for platforms: ${platformsToUpdate.join(', ')}`,
        );
      }
    }

    // Step 4: Create new links
    const newLinks = updateLinksDto.links.map((linkDto) =>
      this.linkRepository.create({
        pageId,
        platform: linkDto.platform,
        url: linkDto.url,
        releaseDate: linkDto.releaseDate, // 2024-12-28: change: added release date for presave
        isPrimary: false, // 2024-12-28: Auto-managed, no longer in DTO
        displayOrder: null, // 2024-12-28: Auto-managed, no longer in DTO
        isActive: true, // New links are active by default
      }),
    );

    const savedLinks = await this.linkRepository.save(newLinks);

    // Step 5: Transform to response DTOs and sort
    const linkDtos: PageLinkDto[] = savedLinks
      .sort((a, b) => {
        // Primary links first, then by display order
        if (a.isPrimary && !b.isPrimary) return -1;
        if (!a.isPrimary && b.isPrimary) return 1;
        return (a.displayOrder || 99) - (b.displayOrder || 99);
      })
      .map((link) => ({
        id: link.id,
        platform: link.platform,
        url: link.url,
        isPrimary: link.isPrimary,
        displayOrder: link.displayOrder,
      }));

    return {
      statusCode: HttpStatus.OK,
      message: `Successfully updated ${savedLinks.length} streaming links`,
      data: linkDtos,
    };
  }

  /**
   * Toggles page publication status (publish/unpublish)
   *
   * Process:
   * 1. Validate user owns the page
   * 2. Check minimum requirements for publishing (at least 1 active link)
   * 3. Update publication status
   * 4. Return updated page
   */
  // 2024-12-28: Added update method for RatedFans pages
  async updatePage(
    pageId: string,
    updatePageDto: any, // UpdatePageDto
    user: User,
  ): Promise<ApiResponse<any>> {
    // Find the page
    const page = await this.pageRepository.findOne({
      where: { id: pageId },
      relations: ['artist'],
    });

    if (!page) {
      throw new HttpException('Page not found', HttpStatus.NOT_FOUND);
    }

    // Check ownership
    const userWithArtists = await this.userRepository.findOne({
      where: { id: user.id },
      relations: ['artistProfiles'],
    });

    const userArtistIds =
      userWithArtists?.artistProfiles?.map((a) => a.id) || [];

    if (!userArtistIds.includes(page.artistId)) {
      throw new HttpException(
        'You do not have permission to update this page',
        HttpStatus.FORBIDDEN,
      );
    }

    // Update the page
    Object.assign(page, updatePageDto);

    // If slug is being updated, check for duplicates
    if (updatePageDto.customSlug && updatePageDto.customSlug !== page.slug) {
      const existingPage = await this.pageRepository.findOne({
        where: { slug: updatePageDto.customSlug },
      });
      if (existingPage) {
        throw new HttpException(
          `Slug "${updatePageDto.customSlug}" is already taken. Please choose a different slug.`,
          HttpStatus.CONFLICT,
        );
      }
      page.slug = updatePageDto.customSlug;
    }

    const savedPage = await this.pageRepository.save(page);
    const transformedPage = await this.transformToDashboardResponse(savedPage);

    return {
      statusCode: HttpStatus.OK,
      message: 'Page updated successfully',
      data: transformedPage,
    };
  }

  // 2024-12-28: Added delete method for RatedFans pages
  async deletePage(pageId: string, user: User): Promise<ApiResponse> {
    // Find the page
    const page = await this.pageRepository.findOne({
      where: { id: pageId },
      relations: ['artist'],
    });

    if (!page) {
      throw new HttpException('Page not found', HttpStatus.NOT_FOUND);
    }

    // Check ownership
    const userWithArtists = await this.userRepository.findOne({
      where: { id: user.id },
      relations: ['artistProfiles'],
    });

    const userArtistIds =
      userWithArtists?.artistProfiles?.map((a) => a.id) || [];

    if (!userArtistIds.includes(page.artistId)) {
      throw new HttpException(
        'You do not have permission to delete this page',
        HttpStatus.FORBIDDEN,
      );
    }

    // Soft delete the page
    await this.pageRepository.softDelete(pageId);

    return {
      statusCode: HttpStatus.OK,
      message: 'Page deleted successfully',
    };
  }

  async togglePagePublication(
    pageId: string,
    publishDto: PublishPageDto,
    user: User,
  ): Promise<ApiResponse<DashboardPageResponseDto>> {
    this.logger.log(
      `Toggling publication for page ${pageId} to ${publishDto.isPublished}`,
    );

    // Step 1: Find page and validate ownership
    const page = await this.pageRepository.findOne({
      where: { id: pageId },
      relations: ['artist', 'artist.user', 'song', 'links'],
    });

    if (!page) {
      throw new HttpException('Page not found', HttpStatus.NOT_FOUND);
    }

    // Validate user owns the page through artist relationship
    if (page.artist?.user?.id !== user.id) {
      throw new HttpException(
        'You can only publish your own pages',
        HttpStatus.FORBIDDEN,
      );
    }

    // Step 2: If publishing, check minimum requirements
    if (publishDto.isPublished) {
      const activeLinks = page.links?.filter((link) => link.isActive) || [];

      if (activeLinks.length === 0) {
        throw new HttpException(
          'Cannot publish page without at least one active streaming link',
          HttpStatus.BAD_REQUEST,
        );
      }

      if (!page.releaseTitle || page.releaseTitle.trim().length === 0) {
        throw new HttpException(
          'Cannot publish page without a release title',
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    // Step 3: Update publication status
    page.isPublished = publishDto.isPublished;
    const updatedPage = await this.pageRepository.save(page);

    // Step 4: Return updated page data
    const responseData = await this.transformToDashboardResponse(updatedPage);

    return {
      statusCode: HttpStatus.OK,
      message: `Page ${publishDto.isPublished ? 'published' : 'unpublished'} successfully`,
      data: responseData,
    };
  }

  /**
   * Saves a promo card generated from the frontend
   *
   * Process:
   * 1. Validate user owns the page
   * 2. Decode base64 image data from frontend
   * 3. Generate unique filename
   * 4. Save file using StorageService
   * 5. Create PromoCard record with metadata
   * 6. Return file info with download URL
   */
  async savePromoCard(
    pageId: string,
    promoUploadDto: PromoCardUploadDto,
    user: User,
  ): Promise<ApiResponse<PromoCardResponseDto>> {
    this.logger.log(`Saving promo card for page ${pageId}`);

    // Step 1: Validate page exists and user owns it
    if (!(await this.validatePageOwnership(pageId, user.id))) {
      throw new HttpException(
        'You can only save promo cards for your own pages',
        HttpStatus.FORBIDDEN,
      );
    }

    // Step 2: Decode base64 image data
    // Extract data from base64 data URL (e.g., "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...")
    const base64Match = promoUploadDto.imageData.match(
      /^data:([^;]+);base64,(.+)$/,
    );

    if (!base64Match) {
      throw new HttpException(
        'Invalid base64 image data format',
        HttpStatus.BAD_REQUEST,
      );
    }

    const mimeType = base64Match[1];
    const base64Data = base64Match[2];
    const imageBuffer = Buffer.from(base64Data, 'base64');

    // Validate image type
    if (!mimeType.startsWith('image/')) {
      throw new HttpException('File must be an image', HttpStatus.BAD_REQUEST);
    }

    // Check file size (limit to 5MB)
    if (imageBuffer.length > 5 * 1024 * 1024) {
      throw new HttpException(
        'Image file too large (max 5MB)',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Step 3: Generate unique filename
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 8);
    const extension = mimeType.split('/')[1];
    const fileName =
      promoUploadDto.fileName ||
      `promo-card-${timestamp}-${randomId}.${extension}`;
    const uniqueFileName = `promo-cards/${pageId}/${timestamp}-${randomId}-${fileName}`;

    // Step 4: Save file using StorageService provider directly
    // Create a mock Multer file for the StorageService
    const mockFile: Express.Multer.File = {
      fieldname: 'promoCard',
      originalname: fileName,
      encoding: '7bit',
      mimetype: mimeType,
      size: imageBuffer.length,
      buffer: imageBuffer,
      destination: '',
      filename: fileName,
      path: '',
      stream: null,
    };

    const uploadResult = await this.storageService.uploadFile(mockFile, user, {
      type: 'image',
      metadata: {
        originalName: promoUploadDto.fileName,
        pageId,
        description: promoUploadDto.description,
        designTemplate: promoUploadDto.designMetadata?.template,
        colors: promoUploadDto.designMetadata?.colors,
      },
      isPublic: false,
    });

    // Step 5: Create PromoCard record
    const promoCard = this.promoCardRepository.create({
      pageId,
      fileName,
      fileUrl: uploadResult.key || uploadResult.path, // Store the storage key/path
      size: imageBuffer.length,
      mimeType,
      metadata: {
        width: promoUploadDto.designMetadata?.dimensions?.width,
        height: promoUploadDto.designMetadata?.dimensions?.height,
        format: extension,
        originalName: promoUploadDto.fileName,
        description: promoUploadDto.description,
      },
    });

    const savedPromoCard = await this.promoCardRepository.save(promoCard);

    // Step 6: Return response with file info
    const responseDto: PromoCardResponseDto = {
      id: savedPromoCard.id,
      pageId: savedPromoCard.pageId,
      fileName: savedPromoCard.fileName,
      fileUrl: savedPromoCard.fileUrl,
      size: savedPromoCard.size,
      mimeType: savedPromoCard.mimeType,
      metadata: savedPromoCard.metadata,
      createdAt: savedPromoCard.createdAt,
    };

    return {
      statusCode: HttpStatus.CREATED,
      message: 'Promo card saved successfully',
      data: responseDto,
    };
  }

  /**
   * Gets all promo cards for a page
   *
   * Process:
   * 1. Validate user owns the page
   * 2. Query promo cards for the page
   * 3. Transform to response DTOs with public URLs
   * 4. Return list
   */
  async getPromoCards(
    pageId: string,
    user: User,
  ): Promise<ApiResponse<PromoCardResponseDto[]>> {
    this.logger.log(`Getting promo cards for page ${pageId}`);

    // Step 1: Validate page exists and user owns it
    if (!(await this.validatePageOwnership(pageId, user.id))) {
      throw new HttpException(
        'You can only access promo cards for your own pages',
        HttpStatus.FORBIDDEN,
      );
    }

    // Step 2: Get all promo cards for the page
    const promoCards = await this.promoCardRepository.find({
      where: { pageId },
      order: { createdAt: 'DESC' }, // Newest first
    });

    // Step 3: Transform to response DTOs
    const promoCardDtos: PromoCardResponseDto[] = promoCards.map((card) => ({
      id: card.id,
      pageId: card.pageId,
      fileName: card.fileName,
      fileUrl: card.fileUrl,
      size: card.size,
      mimeType: card.mimeType,
      metadata: card.metadata,
      createdAt: card.createdAt,
    }));

    return {
      statusCode: HttpStatus.OK,
      message: 'Promo cards retrieved successfully',
      data: promoCardDtos,
    };
  }

  // =============================================================================
  // PRIVATE HELPER METHODS
  // =============================================================================

  /**
   * Generates a URL-friendly slug from artist name and song title
   */
  private generateSlug(artistName: string, songTitle: string): string {
    const combined = `${artistName}-${songTitle}`;
    return combined
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .trim();
  }

  /**
   * Validates that a user owns a page through artist relationship
   */
  private async validatePageOwnership(
    pageId: string,
    userId: string,
  ): Promise<boolean> {
    const page = await this.pageRepository.findOne({
      where: { id: pageId },
      relations: ['artist', 'artist.user'],
    });

    return page?.artist?.user?.id === userId;
  }

  /**
   * Transforms page entity to public response format
   */
  private async transformToPublicResponse(
    page: RatedFansPage,
  ): Promise<PublicPageResponseDto> {
    // 2024-12-28: change: handle null song for platform songs
    let songFilePaths: {
      coverArtPath: string;
      previewClip?: { path: string };
    } = {
      coverArtPath: '',
      previewClip: undefined,
    };
    let coverArtPath = 'https://iili.io/HlHy9Yx.png';

    if (page.song) {
      // 2024-09-22: change: get cover art path from song using SongsService method
      songFilePaths = await this.songsService.returnCoverpathandpreviewclippath(
        page.song,
      );
      coverArtPath =
        songFilePaths.coverArtPath || 'https://iili.io/HlHy9Yx.png';
    }

    // Construct the full page URL
    const baseUrl = process.env.API_BASE_URL || 'http://localhost:3000';
    const pageUrl = `${baseUrl}/r/${page.slug}`;

    return {
      id: page.id,
      slug: page.slug,
      pageUrl, // Full URL to access the page
      releaseTitle: page.releaseTitle, // 2024-09-22: change: renamed from title
      artistName: page.artistName, // 2024-12-28: change: added artist name
      isPublished: page.isPublished,
      isPresaveEnabled: page.isPresaveEnabled,
      releaseDate: page.releaseDate,
      releaseType: page.releaseType || null, // 2024-09-22: change: added release type
      socialMediaLinks:
        page.socialMediaLinks || page.artist?.socialMediaLinks || null, // 2024-09-22: change: fallback logic
      previewClips:
        page.previewClips ||
        (songFilePaths.previewClip?.path
          ? [
              {
                title: page.song?.title || 'Preview',
                url: songFilePaths.previewClip.path,
              },
            ]
          : null), // 2024-12-28: change: support multiple preview clips
      coverArtLink:
        page.coverArtLink || (coverArtPath ? { url: coverArtPath } : null), // 2024-12-28: change: added cover art link with fallback
      createdAt: page.createdAt,
      artist: {
        id: page.artist.id,
        name: page.artist.name,
        musicPlatforms: page.artist.musicPlatforms,
        socialMediaLinks: page.artist.socialMediaLinks,
      },
      song: page.song
        ? {
            id: page.song.id,
            title: page.song.title,
            releaseLanguage: page.song.releaseLanguage,
            primaryGenre: page.song.primaryGenre,
            secondaryGenres: page.song.secondaryGenres,
            isExplicit: page.song.isExplicit,
            description: page.song.description,
            coverArtPath,
            previewClipPath: songFilePaths.previewClip?.path,
            releaseDate: page.song.proposedReleaseDate,
          }
        : {
            // 2024-12-28: change: handle platform songs with no song entity
            id: 'platform-song',
            title: page.releaseTitle,
            releaseLanguage: 'Unknown',
            primaryGenre: 'Unknown',
            secondaryGenres: [],
            isExplicit: false,
            description: null, // 2024-12-28: change: removed description field
            coverArtPath: page.coverArtLink?.url || coverArtPath,
            previewClipPath: page.previewClips?.[0]?.url,
            releaseDate: page.releaseDate,
          },
      links:
        page.links
          ?.filter((link) => link.isActive)
          .sort((a, b) => (a.displayOrder || 99) - (b.displayOrder || 99))
          .map((link) => ({
            id: link.id,
            platform: link.platform,
            url: link.url,
            isPrimary: link.isPrimary,
            displayOrder: link.displayOrder,
          })) || [],
    };
  }

  /**
   * Transforms page entity to dashboard response format
   */
  private async transformToDashboardResponse(
    page: RatedFansPage,
  ): Promise<DashboardPageResponseDto> {
    const publicResponse = await this.transformToPublicResponse(page);

    // 2024-09-22: change: integrate presave stats
    const presaveStatsResponse = await this.presaveService.getPresaveStats(
      page.id,
    );
    const presaveStats =
      presaveStatsResponse.statusCode === 200 ? presaveStatsResponse.data : [];

    return {
      ...publicResponse,
      updatedAt: page.updatedAt,
      presaveStats, // 2024-09-22: change: added presave statistics
      // TODO: Add page view analytics when implemented
      // totalViews: 0,
      // totalClicks: 0,
      // clickThroughRate: 0,
    };
  }
}
