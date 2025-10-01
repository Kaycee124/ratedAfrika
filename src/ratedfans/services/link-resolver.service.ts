import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Song } from '../../songs/entities/song.entity';
import { RatedFansPage } from '../entities/ratedfans-page.entity';
import { StreamingPlatform } from '../entities/ratedfans-link.entity';
import { LinkSuggestion } from '../../common/types/apiresponse';

@Injectable()
export class LinkResolverService {
  private readonly logger = new Logger(LinkResolverService.name);

  constructor(
    @InjectRepository(Song)
    private readonly songRepository: Repository<Song>,
    @InjectRepository(RatedFansPage)
    private readonly pageRepository: Repository<RatedFansPage>,
  ) {}

  /**
   * Get streaming links by ISRC for a specific page (dashboard endpoint)
   *
   * Process:
   * 1. Validate page exists and user owns it
   * 2. Get song ISRC from page relationship
   * 3. Search platforms using ISRC
   * 4. Return suggestions for artist to review
   */
  async getLinksByPageId(pageId: string, user: any): Promise<LinkSuggestion[]> {
    try {
      this.logger.log(
        `Getting ISRC links for page ${pageId} by user ${user.id}`,
      );

      // Find page with song relationship and validate ownership
      const page = await this.pageRepository.findOne({
        where: { id: pageId },
        relations: ['song', 'artist', 'artist.user'],
      });

      if (!page) {
        this.logger.warn(`Page ${pageId} not found`);
        return this.getEmptyResults();
      }

      // Validate user owns the page through artist relationship
      if (page.artist?.user?.id !== user.id) {
        this.logger.warn(`User ${user.id} does not own page ${pageId}`);
        return this.getEmptyResults();
      }

      // Use existing ISRC lookup method
      return this.getLinksByISRC(page.song.id);
    } catch (error) {
      this.logger.error(
        `Error getting links by page ID ${pageId}: ${error.message}`,
      );
      return this.getEmptyResults();
    }
  }

  /**
   * Main method to get streaming links by ISRC
   * This will search various platforms using the song's ISRC code
   */
  async getLinksByISRC(songId: string): Promise<LinkSuggestion[]> {
    try {
      // Get song with ISRC
      const song = await this.songRepository.findOne({
        where: { id: songId },
        select: ['id', 'title', 'isrc'],
        relations: ['primaryArtist'],
      });

      if (!song) {
        this.logger.warn(`Song ${songId} not found`);
        return this.getEmptyResults();
      }

      // Check if ISRC exists - this is optional in the Song entity
      if (!song.isrc || song.isrc.trim().length === 0) {
        this.logger.warn(`Song ${songId} (${song.title}) has no ISRC code`);
        return [
          {
            platform: StreamingPlatform.SPOTIFY,
            url: null,
            found: false,
            error:
              'ISRC not found in song record. Please update the song with an ISRC code or add streaming links manually.',
          },
        ];
      }

      // TODO: Implement actual platform searches
      // For now, return placeholder structure
      const suggestions: LinkSuggestion[] = [
        {
          platform: StreamingPlatform.SPOTIFY,
          url: null,
          found: false,
        },
        {
          platform: StreamingPlatform.APPLE_MUSIC,
          url: null,
          found: false,
        },
        {
          platform: StreamingPlatform.YOUTUBE_MUSIC,
          url: null,
          found: false,
        },
        {
          platform: StreamingPlatform.DEEZER,
          url: null,
          found: false,
        },
        {
          platform: StreamingPlatform.TIDAL,
          url: null,
          found: false,
        },
      ];

      this.logger.log(
        `Generated ${suggestions.length} link suggestions for song ${songId}`,
      );
      return suggestions;
    } catch (error) {
      this.logger.error(
        `Error getting links by ISRC for song ${songId}: ${error.message}`,
      );
      return this.getEmptyResults();
    }
  }

  private getEmptyResults(): LinkSuggestion[] {
    return Object.values(StreamingPlatform).map((platform) => ({
      platform,
      url: null,
      found: false,
      error: 'Service temporarily unavailable',
    }));
  }

  // TODO: Implement individual platform search methods
  // private async searchSpotify(isrc: string): Promise<string | null> {}
  // private async searchAppleMusic(isrc: string): Promise<string | null> {}
  // private async searchYouTubeMusic(isrc: string): Promise<string | null> {}
  // etc.
}
