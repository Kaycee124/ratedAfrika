/* eslint-disable @typescript-eslint/no-unused-vars */
// storage / providers / local - storage.provider.ts;
import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import { promises as fsPromises } from 'fs';
import * as path from 'path';
import { Readable } from 'stream';
import {
  StorageProvider,
  StorageConfig,
  UploadOptions,
  DownloadOptions,
} from '../interfaces/storage-provider.interface';
import * as crypto from 'crypto';
import { pipeline } from 'stream/promises';

@Injectable()
export class LocalStorageProvider implements StorageProvider {
  private basePath: string;
  private readonly logger = new Logger(LocalStorageProvider.name);

  async initialize(config: StorageConfig): Promise<void> {
    this.basePath = path.resolve(config.basePath || 'storage');

    try {
      await fsPromises.mkdir(this.basePath, { recursive: true });
      this.logger.log(`Initialized local storage at: ${this.basePath}`);
    } catch (error) {
      this.logger.error(`Failed to initialize local storage`, error.stack);
      throw error;
    }
  }

  private getFullPath(key: string): string {
    return path.join(this.basePath, key);
  }

  private async ensureDirectory(filePath: string): Promise<void> {
    const directory = path.dirname(filePath);
    await fsPromises.mkdir(directory, { recursive: true });
  }

  // async upload(
  //   key: string,
  //   data: Buffer,
  //   options: UploadOptions = {},
  // ): Promise<{ key: string; url: string }> {
  //   try {
  //     const fullPath = this.getFullPath(key);
  //     await this.ensureDirectory(fullPath);

  //     await fsPromises.writeFile(fullPath, data);

  //     if (options.metadata) {
  //       await this.updateMetadata(key, options.metadata);
  //     }

  //     return {
  //       key,
  //       url: `file://${fullPath}`,
  //     };
  //   } catch (error) {
  //     this.logger.error(`Failed to upload file ${key}`, error.stack);
  //     throw error;
  //   }
  // }
  async upload(
    key: string,
    data: Buffer,
    options: UploadOptions = {},
  ): Promise<{ key: string; url: string }> {
    try {
      if (!data) {
        throw new Error('Upload data is required');
      }

      if (!Buffer.isBuffer(data)) {
        throw new Error('Upload data must be a Buffer');
      }

      const fullPath = this.getFullPath(key);
      await this.ensureDirectory(fullPath);

      await fsPromises.writeFile(fullPath, data);

      if (options.metadata) {
        await this.updateMetadata(key, options.metadata);
      }

      return {
        key,
        url: `file://${fullPath}`,
      };
    } catch (error) {
      this.logger.error(`Failed to upload file ${key}`, error.stack);
      throw error;
    }
  }

  async uploadStream(
    key: string,
    stream: Readable,
    options: UploadOptions = {},
  ): Promise<{ key: string; url: string }> {
    try {
      const fullPath = this.getFullPath(key);
      await this.ensureDirectory(fullPath);

      const writeStream = fs.createWriteStream(fullPath);

      await new Promise((resolve, reject) => {
        stream.pipe(writeStream).on('finish', resolve).on('error', reject);
      });

      if (options.metadata) {
        await this.updateMetadata(key, options.metadata);
      }

      return {
        key,
        url: `file://${fullPath}`,
      };
    } catch (error) {
      this.logger.error(`Failed to upload stream ${key}`, error.stack);
      throw error;
    }
  }

  async download(
    key: string,
    options: DownloadOptions = {},
  ): Promise<Buffer | Readable> {
    try {
      const fullPath = this.getFullPath(key);

      if (options.asStream) {
        return fs.createReadStream(fullPath);
      }

      return await fsPromises.readFile(fullPath);
    } catch (error) {
      this.logger.error(`Failed to download file ${key}`, error.stack);
      throw error;
    }
  }

  async getSignedUrl(key: string, expiresIn: number): Promise<string> {
    // Local storage doesn't support signed URLs, return direct file path
    return `file://${this.getFullPath(key)}`;
  }

  async delete(key: string): Promise<void> {
    try {
      const fullPath = this.getFullPath(key);
      await fsPromises.unlink(fullPath);

      // Also try to delete metadata file if it exists
      const metadataPath = `${fullPath}.metadata.json`;
      try {
        await fsPromises.unlink(metadataPath);
      } catch (error) {
        // Ignore if metadata file doesn't exist
      }
    } catch (error) {
      this.logger.error(`Failed to delete file ${key}`, error.stack);
      throw error;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      await fsPromises.access(this.getFullPath(key));
      return true;
    } catch {
      return false;
    }
  }

  async list(prefix?: string): Promise<string[]> {
    try {
      const searchPath = prefix ? this.getFullPath(prefix) : this.basePath;
      const files = await fsPromises.readdir(searchPath, { recursive: true });
      return files.filter((file) => !file.endsWith('.metadata.json'));
    } catch (error) {
      this.logger.error(`Failed to list files`, error.stack);
      throw error;
    }
  }

  async getMetadata(key: string): Promise<Record<string, any>> {
    try {
      const metadataPath = `${this.getFullPath(key)}.metadata.json`;
      const data = await fsPromises.readFile(metadataPath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      // Return empty object if metadata file doesn't exist
      return {};
    }
  }

  async updateMetadata(
    key: string,
    metadata: Record<string, string>,
  ): Promise<void> {
    try {
      const metadataPath = `${this.getFullPath(key)}.metadata.json`;
      await fsPromises.writeFile(
        metadataPath,
        JSON.stringify(metadata, null, 2),
      );
    } catch (error) {
      this.logger.error(`Failed to update metadata for ${key}`, error.stack);
      throw error;
    }
  }

  async move(sourceKey: string, destinationKey: string): Promise<void> {
    try {
      const sourcePath = this.getFullPath(sourceKey);
      const destinationPath = this.getFullPath(destinationKey);

      await this.ensureDirectory(destinationPath);
      await fsPromises.rename(sourcePath, destinationPath);

      // Move metadata if it exists
      const sourceMetadataPath = `${sourcePath}.metadata.json`;
      const destinationMetadataPath = `${destinationPath}.metadata.json`;

      try {
        await fsPromises.rename(sourceMetadataPath, destinationMetadataPath);
      } catch {
        // Ignore if metadata doesn't exist
      }
    } catch (error) {
      this.logger.error(
        `Failed to move file from ${sourceKey} to ${destinationKey}`,
        error.stack,
      );
      throw error;
    }
  }

  async copy(sourceKey: string, destinationKey: string): Promise<void> {
    try {
      const sourcePath = this.getFullPath(sourceKey);
      const destinationPath = this.getFullPath(destinationKey);

      await this.ensureDirectory(destinationPath);
      await fsPromises.copyFile(sourcePath, destinationPath);

      // Copy metadata if it exists
      const sourceMetadataPath = `${sourcePath}.metadata.json`;
      const destinationMetadataPath = `${destinationPath}.metadata.json`;

      try {
        await fsPromises.copyFile(sourceMetadataPath, destinationMetadataPath);
      } catch {
        // Ignore if metadata doesn't exist
      }
    } catch (error) {
      this.logger.error(
        `Failed to copy file from ${sourceKey} to ${destinationKey}`,
        error.stack,
      );
      throw error;
    }
  }
  //   added methods
  async initiateMultipartUpload(key: string): Promise<string> {
    const uploadId = `local_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const uploadDir = path.join(this.basePath, `tmp_${uploadId}`);
    await fs.promises.mkdir(uploadDir, { recursive: true });
    return uploadId;
  }

  async uploadPart(
    key: string,
    uploadId: string,
    partNumber: number,
    body: Buffer | string,
  ): Promise<{ ETag: string; PartNumber: number }> {
    const uploadDir = path.join(this.basePath, `tmp_${uploadId}`);
    const partPath = path.join(uploadDir, `part_${partNumber}`);

    const content = Buffer.isBuffer(body) ? body : Buffer.from(body);
    await fs.promises.writeFile(partPath, content);

    const hash = crypto.createHash('md5').update(content).digest('hex');

    return {
      ETag: hash,
      PartNumber: partNumber,
    };
  }

  async completeMultipartUpload(
    key: string,
    uploadId: string,
    parts: { ETag: string; PartNumber: number }[],
  ): Promise<void> {
    const uploadDir = path.join(this.basePath, `tmp_${uploadId}`);
    const finalPath = this.getFullPath(key);

    const writeStream = fs.createWriteStream(finalPath);

    try {
      for (const part of parts.sort((a, b) => a.PartNumber - b.PartNumber)) {
        const partPath = path.join(uploadDir, `part_${part.PartNumber}`);
        await pipeline(fs.createReadStream(partPath), writeStream, {
          end: false,
        });
      }
      writeStream.end();
      await fsPromises.rm(uploadDir, { recursive: true, force: true });
    } catch (error) {
      writeStream.destroy();
      throw error;
    }
  }

  async abortMultipartUpload(key: string, uploadId: string): Promise<void> {
    const uploadDir = path.join(this.basePath, `tmp_${uploadId}`);
    await fsPromises.rm(uploadDir, { recursive: true, force: true });
  }

  async deleteObject(key: string): Promise<void> {
    const fullPath = this.getFullPath(key);
    await fsPromises.unlink(fullPath);
  }

  getBasePath(): string {
    return this.basePath;
  }
}
