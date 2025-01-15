import { registerAs } from '@nestjs/config';

export const StorageConfig = registerAs('storage', () => ({
  // Local storage config
  local: {
    uploadDir: process.env.UPLOAD_DIR || 'uploads',
    tempDir: process.env.TEMP_DIR || 'temp',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 1024 * 1024 * 1024, // 1GB
    chunkSize: parseInt(process.env.CHUNK_SIZE) || 1024 * 1024 * 5, // 5MB
  },

  // S3 config
  s3: {
    bucket: process.env.AWS_S3_BUCKET,
    region: process.env.AWS_REGION,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },

  // CDN config
  cdn: {
    baseUrl: process.env.CDN_BASE_URL,
    enabled: process.env.CDN_ENABLED === 'true',
  },

  // Audio processing config
  audio: {
    allowedFormats: ['mp3', 'wav', 'flac'],
    minBitrate: 128000, // 128kbps
    maxBitrate: 320000, // 320kbps
    minSampleRate: 44100, // 44.1kHz
    previewDuration: 30, // 30 seconds
  },

  // Image processing config
  image: {
    allowedFormats: ['jpeg', 'png', 'webp'],
    maxDimension: 3000,
    minDimension: 500,
    thumbnailSizes: {
      small: 150,
      medium: 300,
      large: 600,
    },
  },

  // Video processing config
  video: {
    allowedFormats: ['mp4', 'mov'],
    maxDuration: 600, // 10 minutes
    maxFileSize: 1024 * 1024 * 1024, // 1GB
    previewDuration: 30, // 30 seconds
    qualitySettings: {
      sd: {
        width: 854,
        height: 480,
        bitrate: '1000k',
      },
      hd: {
        width: 1280,
        height: 720,
        bitrate: '2500k',
      },
      full_hd: {
        width: 1920,
        height: 1080,
        bitrate: '5000k',
      },
      '4k': {
        width: 3840,
        height: 2160,
        bitrate: '15000k',
      },
    },
  },
}));
