import { MulterModuleOptions } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, resolve } from 'path';
import { UnsupportedMediaTypeException } from '@nestjs/common';
import { mkdirSync } from 'fs';
import { randomUUID } from 'crypto';

const cvUploadDirectory = resolve(process.cwd(), 'uploads', 'cvs');

export const multerConfig: MulterModuleOptions = {
  storage: diskStorage({
    destination: (_req, _file, callback) => {
      mkdirSync(cvUploadDirectory, { recursive: true });
      callback(null, cvUploadDirectory);
    },
    filename: (req, file, callback) => {
      const extension = extname(file.originalname).toLowerCase();
      callback(null, `cv-${Date.now()}-${randomUUID()}${extension}`);
    },
  }),
  fileFilter: (req, file, callback) => {
    const extensionAllowed = /\.(pdf|docx)$/i.test(file.originalname);
    const mimeAllowed = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(file.mimetype);
    if (!extensionAllowed || !mimeAllowed) {
      return callback(new UnsupportedMediaTypeException({
        code: 'UNSUPPORTED_CV_TYPE',
        message: 'Only valid PDF and DOCX files are allowed',
      }), false);
    }
    callback(null, true);
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
};
