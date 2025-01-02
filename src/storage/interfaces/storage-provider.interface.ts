// // src/infrastructure/storage/interfaces/storage-provider.interface.ts
// import { Readable } from 'stream';

// export interface StorageConfig {
//   bucket: string;
//   region?: string;
//   endpoint?: string;
//   accessKey?: string;
//   secretKey?: string;
//   basePath?: string;
// }

// export interface UploadOptions {
//   contentType?: string;
//   isPublic?: boolean;
//   metadata?: Record<string, string>;
// }

// export interface DownloadOptions {
//   asStream?: boolean;
// }

// export interface StorageProvider {
//   /**
//    * Initialize the storage provider with configuration
//    */
//   initialize(config: StorageConfig): Promise<void>;

//   /**
//    * Upload a file from a buffer
//    */
//   upload(
//     key: string,
//     data: Buffer,
//     options?: UploadOptions,
//   ): Promise<{ key: string; url: string }>;

//   /**
//    * Upload a file from a stream
//    */
//   uploadStream(
//     key: string,
//     stream: Readable,
//     options?: UploadOptions,
//   ): Promise<{ key: string; url: string }>;

//   /**
//    * Download a file as a buffer
//    */
//   download(key: string, options?: DownloadOptions): Promise<Buffer | Readable>;

//   /**
//    * Generate a signed URL for temporary access
//    */
//   getSignedUrl(key: string, expiresIn: number): Promise<string>;

//   /**
//    * Delete a file
//    */
//   delete(key: string): Promise<void>;

//   /**
//    * Check if a file exists
//    */
//   exists(key: string): Promise<boolean>;

//   /**
//    * List files in a directory/prefix
//    */
//   list(prefix?: string): Promise<string[]>;

//   /**
//    * Get file metadata
//    */
//   getMetadata(key: string): Promise<Record<string, any>>;

//   /**
//    * Update file metadata
//    */
//   updateMetadata(key: string, metadata: Record<string, string>): Promise<void>;

//   /**
//    * Move/rename a file
//    */
//   move(sourceKey: string, destinationKey: string): Promise<void>;

//   /**
//    * Copy a file
//    */
//   copy(sourceKey: string, destinationKey: string): Promise<void>;
// }

// src/infrastructure/storage/interfaces/storage-provider.interface.ts
import { Readable } from 'stream';

export interface StorageConfig {
  bucket: string;
  region?: string;
  endpoint?: string;
  accessKey?: string;
  secretKey?: string;
  basePath?: string;
}

export interface UploadOptions {
  contentType?: string;
  isPublic?: boolean;
  metadata?: Record<string, string>;
}

export interface DownloadOptions {
  asStream?: boolean;
}

export interface StorageProvider {
  /**
   * Initialize the storage provider with configuration
   */
  initialize(config: StorageConfig): Promise<void>;

  /**
   * Upload a file from a buffer
   */
  upload(
    key: string,
    data: Buffer,
    options?: UploadOptions,
  ): Promise<{ key: string; url: string }>;

  /**
   * Upload a file from a stream
   */
  uploadStream(
    key: string,
    stream: Readable,
    options?: UploadOptions,
  ): Promise<{ key: string; url: string }>;

  /**
   * Download a file as a buffer
   */
  download(key: string, options?: DownloadOptions): Promise<Buffer | Readable>;

  /**
   * Generate a signed URL for temporary access
   */
  getSignedUrl(key: string, expiresIn: number): Promise<string>;

  /**
   * Delete a file
   */
  delete(key: string): Promise<void>;

  /**
   * Check if a file exists
   */
  exists(key: string): Promise<boolean>;

  /**
   * List files in a directory/prefix
   */
  list(prefix?: string): Promise<string[]>;

  /**
   * Get file metadata
   */
  getMetadata(key: string): Promise<Record<string, any>>;

  /**
   * Update file metadata
   */
  updateMetadata(key: string, metadata: Record<string, string>): Promise<void>;

  /**
   * Move/rename a file
   */
  move(sourceKey: string, destinationKey: string): Promise<void>;

  /**
   * Copy a file
   */
  copy(sourceKey: string, destinationKey: string): Promise<void>;

  /**
   * Initiate a multipart upload
   */
  initiateMultipartUpload(key: string): Promise<string>;

  /**
   * Upload a part in a multipart upload
   */
  uploadPart(
    key: string,
    uploadId: string,
    partNumber: number,
    body: Buffer | string,
  ): Promise<{
    ETag: string;
    PartNumber: number;
  }>;

  /**
   * Complete a multipart upload
   */
  completeMultipartUpload(
    key: string,
    uploadId: string,
    parts: { ETag: string; PartNumber: number }[],
  ): Promise<void>;

  /**
   * Abort a multipart upload
   */
  abortMultipartUpload(key: string, uploadId: string): Promise<void>;

  /**
   * Delete a specific object/file
   */
  deleteObject(key: string): Promise<void>;

  /**
   * Get the base path (mainly for local storage)
   */
  getBasePath(): string;
}
