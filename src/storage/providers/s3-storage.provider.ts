// src/infrastructure/storage/providers/s3-storage.provider.ts
import { Injectable, Logger } from '@nestjs/common';
import { S3 } from 'aws-sdk';
import { Readable } from 'stream';
import {
  StorageProvider,
  StorageConfig,
  UploadOptions,
  DownloadOptions,
} from '../interfaces/storage-provider.interface';

@Injectable()
export class S3StorageProvider implements StorageProvider {
  private s3: S3;
  private bucket: string;
  private readonly logger = new Logger(S3StorageProvider.name);

  async initialize(config: StorageConfig): Promise<void> {
    this.bucket = config.bucket;

    const s3Config: S3.ClientConfiguration = {
      region: config.region,
      credentials: {
        accessKeyId: config.accessKey,
        secretAccessKey: config.secretKey,
      },
    };

    if (config.endpoint) {
      s3Config.endpoint = config.endpoint;
    }

    this.s3 = new S3(s3Config);

    // Verify bucket exists
    try {
      await this.s3.headBucket({ Bucket: this.bucket }).promise();
      this.logger.log(`Successfully connected to S3 bucket: ${this.bucket}`);
    } catch (error) {
      this.logger.error(
        `Failed to connect to S3 bucket: ${this.bucket}`,
        error.stack,
      );
      throw error;
    }
  }

  async upload(
    key: string,
    data: Buffer,
    options: UploadOptions = {},
  ): Promise<{ key: string; url: string }> {
    try {
      const uploadParams: S3.PutObjectRequest = {
        Bucket: this.bucket,
        Key: key,
        Body: data,
        ContentType: options.contentType,
        Metadata: options.metadata,
        ACL: options.isPublic ? 'public-read' : 'private',
      };

      const result = await this.s3.upload(uploadParams).promise();

      return {
        key: result.Key,
        url: result.Location,
      };
    } catch (error) {
      this.logger.error(`Failed to upload file ${key} to S3`, error.stack);
      throw error;
    }
  }

  async uploadStream(
    key: string,
    stream: Readable,
    options: UploadOptions = {},
  ): Promise<{ key: string; url: string }> {
    try {
      const uploadParams: S3.PutObjectRequest = {
        Bucket: this.bucket,
        Key: key,
        Body: stream,
        ContentType: options.contentType,
        Metadata: options.metadata,
        ACL: options.isPublic ? 'public-read' : 'private',
      };

      const result = await this.s3.upload(uploadParams).promise();

      return {
        key: result.Key,
        url: result.Location,
      };
    } catch (error) {
      this.logger.error(`Failed to upload stream ${key} to S3`, error.stack);
      throw error;
    }
  }

  async download(
    key: string,
    options: DownloadOptions = {},
  ): Promise<Buffer | Readable> {
    try {
      const downloadParams: S3.GetObjectRequest = {
        Bucket: this.bucket,
        Key: key,
      };

      const result = await this.s3.getObject(downloadParams).promise();

      if (options.asStream) {
        const stream = this.s3.getObject(downloadParams).createReadStream();
        return stream;
      }

      return result.Body as Buffer;
    } catch (error) {
      this.logger.error(`Failed to download file ${key} from S3`, error.stack);
      throw error;
    }
  }

  async getSignedUrl(key: string, expiresIn: number): Promise<string> {
    try {
      const params = {
        Bucket: this.bucket,
        Key: key,
        Expires: expiresIn,
      };

      return await this.s3.getSignedUrlPromise('getObject', params);
    } catch (error) {
      this.logger.error(
        `Failed to generate signed URL for ${key}`,
        error.stack,
      );
      throw error;
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.s3
        .deleteObject({
          Bucket: this.bucket,
          Key: key,
        })
        .promise();
    } catch (error) {
      this.logger.error(`Failed to delete file ${key} from S3`, error.stack);
      throw error;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      await this.s3
        .headObject({
          Bucket: this.bucket,
          Key: key,
        })
        .promise();
      return true;
    } catch (error) {
      if (error.code === 'NotFound') {
        return false;
      }
      throw error;
    }
  }

  async list(prefix?: string): Promise<string[]> {
    try {
      const params: S3.ListObjectsV2Request = {
        Bucket: this.bucket,
        Prefix: prefix,
      };

      const result = await this.s3.listObjectsV2(params).promise();
      return result.Contents.map((object) => object.Key);
    } catch (error) {
      this.logger.error(`Failed to list objects in S3 bucket`, error.stack);
      throw error;
    }
  }

  async getMetadata(key: string): Promise<Record<string, any>> {
    try {
      const result = await this.s3
        .headObject({
          Bucket: this.bucket,
          Key: key,
        })
        .promise();

      return result.Metadata || {};
    } catch (error) {
      this.logger.error(`Failed to get metadata for ${key}`, error.stack);
      throw error;
    }
  }

  async updateMetadata(
    key: string,
    metadata: Record<string, string>,
  ): Promise<void> {
    try {
      // S3 requires copying the object to update metadata
      await this.s3
        .copyObject({
          Bucket: this.bucket,
          CopySource: `${this.bucket}/${key}`,
          Key: key,
          Metadata: metadata,
          MetadataDirective: 'REPLACE',
        })
        .promise();
    } catch (error) {
      this.logger.error(`Failed to update metadata for ${key}`, error.stack);
      throw error;
    }
  }

  async move(sourceKey: string, destinationKey: string): Promise<void> {
    try {
      // Copy the object
      await this.s3
        .copyObject({
          Bucket: this.bucket,
          CopySource: `${this.bucket}/${sourceKey}`,
          Key: destinationKey,
        })
        .promise();

      // Delete the original
      await this.delete(sourceKey);
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
      await this.s3
        .copyObject({
          Bucket: this.bucket,
          CopySource: `${this.bucket}/${sourceKey}`,
          Key: destinationKey,
        })
        .promise();
    } catch (error) {
      this.logger.error(
        `Failed to copy file from ${sourceKey} to ${destinationKey}`,
        error.stack,
      );
      throw error;
    }
  }
  // Add these methods to S3StorageProvider class

  async initiateMultipartUpload(key: string): Promise<string> {
    const params = {
      Bucket: this.bucket,
      Key: key,
    };

    const result = await this.s3.createMultipartUpload(params).promise();
    return result.UploadId;
  }

  async uploadPart(
    key: string,
    uploadId: string,
    partNumber: number,
    body: Buffer | string,
  ): Promise<{ ETag: string; PartNumber: number }> {
    const params = {
      Bucket: this.bucket,
      Key: key,
      UploadId: uploadId,
      PartNumber: partNumber,
      Body: body,
    };

    const result = await this.s3.uploadPart(params).promise();

    return {
      ETag: result.ETag,
      PartNumber: partNumber,
    };
  }

  async completeMultipartUpload(
    key: string,
    uploadId: string,
    parts: { ETag: string; PartNumber: number }[],
  ): Promise<void> {
    const params = {
      Bucket: this.bucket,
      Key: key,
      UploadId: uploadId,
      MultipartUpload: {
        Parts: parts,
      },
    };

    await this.s3.completeMultipartUpload(params).promise();
  }

  async abortMultipartUpload(key: string, uploadId: string): Promise<void> {
    const params = {
      Bucket: this.bucket,
      Key: key,
      UploadId: uploadId,
    };

    await this.s3.abortMultipartUpload(params).promise();
  }

  async deleteObject(key: string): Promise<void> {
    await this.s3
      .deleteObject({
        Bucket: this.bucket,
        Key: key,
      })
      .promise();
  }

  getBasePath(): string {
    return this.bucket;
  }
}
