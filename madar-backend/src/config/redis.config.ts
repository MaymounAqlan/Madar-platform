import { registerAs } from '@nestjs/config';

export const getRedisConfig = () => {
  const url = process.env.REDIS_URL;
  if (url) {
    try {
      const parsedUrl = new URL(url);
      return {
        host: parsedUrl.hostname,
        port: parseInt(parsedUrl.port, 10) || 6379,
        password: parsedUrl.password || undefined,
        username: parsedUrl.username || undefined,
        tls: url.startsWith('rediss://') ? {} : undefined,
      };
    } catch (e) {
      console.warn('Failed to parse REDIS_URL, falling back to individual vars');
    }
  }

  return {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
  };
};

export default registerAs('redis', () => getRedisConfig());
