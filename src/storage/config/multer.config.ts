/* eslint-disable @typescript-eslint/no-unsafe-function-type */
// src/infrastructure/storage/config/multer.config.ts

import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { HttpException, HttpStatus } from '@nestjs/common';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { Request } from 'express';
import { v4 as uuidv4 } from 'uuid';

export const multerOptions: MulterOptions = {
  fileFilter: (req: Request, file: Express.Multer.File, callback: Function) => {
    // Check file extension
    const ext = extname(file.originalname).toLowerCase();
    const allowedExtRegex = /\.(jpg|jpeg|png|gif|mp3|wav|mp4|mov)$/i;

    if (!allowedExtRegex.test(ext)) {
      return callback(
        new HttpException(
          `Unsupported file type ${ext}. Allowed types: jpg, jpeg, png, gif, mp3, wav, mp4, mov`,
          HttpStatus.BAD_REQUEST,
        ),
        false,
      );
    }

    // Check MIME type
    const mimeType = file.mimetype.toLowerCase();
    const allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'audio/mpeg',
      'audio/wav',
      'video/mp4',
      'video/quicktime',
    ];

    if (!allowedMimeTypes.includes(mimeType)) {
      return callback(
        new HttpException(
          `Unsupported MIME type ${mimeType}`,
          HttpStatus.BAD_REQUEST,
        ),
        false,
      );
    }

    // Validate MIME type matches extension
    const validMimeTypeMap = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.mp3': 'audio/mpeg',
      '.wav': 'audio/wav',
      '.mp4': 'video/mp4',
      '.mov': 'video/quicktime',
    };

    if (validMimeTypeMap[ext] !== mimeType) {
      return callback(
        new HttpException(
          'File extension does not match its content type',
          HttpStatus.BAD_REQUEST,
        ),
        false,
      );
    }

    callback(null, true);
  },
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
  },
  storage: diskStorage({
    destination: './uploads',
    filename: (req: Request, file: Express.Multer.File, callback: Function) => {
      const uniqueSuffix = uuidv4();
      const ext = extname(file.originalname).toLowerCase();
      callback(null, `${uniqueSuffix}${ext}`);
    },
  }),
};

export const MULTER_CONFIG_TOKEN = 'MULTER_CONFIG';
