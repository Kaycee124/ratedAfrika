// Enum definitions
export enum ReleaseContainerType {
  EP = 'EP',
  ALBUM = 'ALBUM',
}

export enum ReleaseContainerStatus {
  DRAFT = 'DRAFT',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETE = 'COMPLETE',
  PENDING_REVIEW = 'PENDING_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  PUBLISHED = 'PUBLISHED',
}

export enum ReleaseType {
  SINGLE = 'SINGLE',
  ALBUM = 'ALBUM',
  EP = 'EP',
}

export enum SongStatus {
  DRAFT = 'DRAFT',
  PENDING_REVIEW = 'PENDING_REVIEW',
  IN_REVIEW = 'IN_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  PUBLISHED = 'PUBLISHED',
  TAKEN_DOWN = 'TAKEN_DOWN',
}

// Entity interfaces
export interface Artist {
  id: string;
  name: string;
  email: string;
  country: string;
  phoneNumber: string;
  website?: string;
  genres: string[];
  bio?: string;
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

export interface TempArtist {
  id: string;
  name: string;
  hasStreamingPresence: boolean;
  spotifyUrl?: string;
  appleMusicUrl?: string;
  youtubeUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Type for a song with file paths
export interface SongWithUrls {
  id: string;
  title: string;
  releaseType: ReleaseType;
  releaseLanguage: string;
  label: string;
  primaryGenre: string;
  secondaryGenres: string[];
  recordingYear: number;
  isExplicit: boolean;
  isrc: string | null;
  description: string | null;
  originalReleaseDate: Date | null;
  proposedReleaseDate: Date;
  releaseTime: string;
  isPreOrder: boolean;
  preOrderDate: Date | null;
  trackPrice: number;
  targetStores: string[];
  targetCountries: string[];
  status: SongStatus;
  reviewNotes: string | null;
  createdAt: Date;
  updatedAt: Date;
  trackNumber: number | null;

  // Fields with file paths
  coverArtPath: string;
  masterTrackPath: string;
  mixVersions?: {
    versionLabel: string;
    fileId: string;
    path: string;
  }[];
  previewClip?: {
    fileId: string;
    startTime: number;
    endTime: number;
    path: string;
  };
  musicVideo?: {
    url: string;
    thumbnailId?: string;
    path?: string;
  };

  // Split sheet related fields
  splitSheetId?: string;
  splitSheet?: {
    id: string;
    entries: {
      id: string;
      recipientEmail: string;
      percentage: number;
      status: string;
      userId?: string;
    }[];
    createdAt: Date;
    updatedAt: Date;
  };

  // Related entities
  primaryArtist: Artist;
  featuredPlatformArtists?: Artist[];
  featuredTempArtists?: TempArtist[];
}

// Type for a release container (album or EP)
export interface ReleaseContainerWithUrls {
  id: string;
  title: string;
  type: ReleaseContainerType;
  coverArtPath: string;
  releaseDate: Date;
  status: ReleaseContainerStatus;
  totalTracks: number;
  tracks: SongWithUrls[];
}

// Type for the complete discography response
export interface DiscographyResponse {
  singles: SongWithUrls[];
  albums: ReleaseContainerWithUrls[];
  eps: ReleaseContainerWithUrls[];
}
