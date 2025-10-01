import { StreamingPlatform } from '../entities/ratedfans-link.entity';
import { PresaveStatus } from '../entities/presave-signup.entity';

export class PageLinkDto {
  id: string;
  platform: StreamingPlatform;
  url: string;
  isPrimary: boolean;
  displayOrder: number | null;
}

export class PageArtistDto {
  id: string;
  name: string;
  musicPlatforms: {
    spotify?: string;
    appleMusic?: string;
    amazonMusic?: string;
    deezer?: string;
    audiomack?: string;
    tidal?: string;
    youtube?: string;
  };
  socialMediaLinks: {
    instagram?: string;
    facebook?: string;
    tiktok?: string;
    x?: string;
  };
}

export class PageSongDto {
  id: string;
  title: string;
  releaseLanguage: string;
  primaryGenre: string;
  secondaryGenres: string[];
  isExplicit: boolean;
  description: string | null;
  coverArtPath: string;
  previewClipPath?: string;
  releaseDate?: Date;
}

export class PublicPageResponseDto {
  id: string;
  slug: string;
  pageUrl: string; // Full URL to access the page (e.g., https://domain.com/r/slug)
  releaseTitle: string; // 2024-09-22: change: renamed from title
  artistName: string; // 2024-12-28: change: added artist name field
  isPublished: boolean;
  isPresaveEnabled: boolean;
  releaseDate: Date | null;
  releaseType: string | null; // 2024-09-22: change: added release type
  socialMediaLinks: object | null; // 2024-09-22: change: page-specific social media
  previewClips: { title: string; url: string }[] | null; // 2024-12-28: change: support multiple preview clips with titles
  coverArtLink: { url: string } | null; // 2024-12-28: change: optional cover art link
  createdAt: Date;

  // Related data
  artist: PageArtistDto;
  song: PageSongDto;
  links: PageLinkDto[];
}

export class DashboardPageResponseDto extends PublicPageResponseDto {
  updatedAt: Date;

  // Additional data for artist dashboard
  presaveStats?: {
    platform: StreamingPlatform;
    status: PresaveStatus;
    count: number;
  }[];

  totalViews?: number;
  totalClicks?: number;
  clickThroughRate?: number;
}

export class PageListItemDto {
  id: string;
  slug: string;
  pageUrl: string; // Full URL to access the page
  releaseTitle: string; // 2024-09-22: change: renamed from title
  isPublished: boolean;
  isPresaveEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;

  // Minimal song/artist data for list view
  songTitle: string;
  artistName: string;

  // Quick stats
  totalLinks: number;
  totalPresaves?: number;
}
