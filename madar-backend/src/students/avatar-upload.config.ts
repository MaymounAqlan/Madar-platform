import { UnsupportedMediaTypeException } from '@nestjs/common';
import { memoryStorage } from 'multer';

const allowedAvatarMimeTypes = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
]);

export const avatarUploadConfig = {
  storage: memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (
    _request: unknown,
    file: Express.Multer.File,
    callback: (error: Error | null, acceptFile: boolean) => void,
  ) => {
    if (!allowedAvatarMimeTypes.has(file.mimetype)) {
      return callback(
        new UnsupportedMediaTypeException({
          code: 'UNSUPPORTED_AVATAR_TYPE',
          message: 'Only JPEG, PNG, and WebP images are allowed',
        }),
        false,
      );
    }
    callback(null, true);
  },
};
