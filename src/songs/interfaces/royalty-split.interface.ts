// src/songs/interfaces/royalty-splits.interface.ts

export interface ContributorShare {
  contributorId: string;
  share: number; // Percentage share (e.g., 10 for 10%)
}

export interface WriterShare {
  writerId: string;
  share: number; // Percentage share (e.g., 15 for 15%)
}

export interface RoyaltySplits {
  artistShare: number; // Percentage share (e.g., 40 for 40%)
  contributorShares: ContributorShare[];
  writerShares: WriterShare[];
  labelShare?: number; // Optional percentage share, defaults to 0
  serviceShare: number; // Percentage share (e.g., 15 for 15%)
}

export interface SongValidationError {
  field: string;
  message: string;
}

export interface SongValidationResult {
  isValid: boolean;
  errors?: SongValidationError[];
}
