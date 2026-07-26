import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger, BadRequestException } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.enableShutdownHooks();

  // Validate session secret in production
  const isProduction = process.env.NODE_ENV === 'production';
  if (isProduction && !process.env.SESSION_SECRET) {
    logger.error('SESSION_SECRET environment variable is missing. OAuth authentication will fail or be insecure.');
    process.exit(1);
  }

  app.set('trust proxy', 1);

  app.use(
    session({
      name: 'madar.oauth.sid',
      secret: process.env.SESSION_SECRET || 'fallback-dev-secret-do-not-use-in-prod',
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax',
        maxAge: 10 * 60 * 1000, // 10 minutes is enough for OAuth flow
      },
    }),
  );

  // Serve static files for uploads
  const uploadDir = process.env.UPLOAD_DIR || join(process.cwd(), 'uploads');
  app.useStaticAssets(uploadDir, {
    prefix: '/uploads',
  });

  // CORS
  const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:3000,http://localhost:5173')
    .split(',')
    .map(url => url.trim());
    
  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
  });

  // Cookie parser
  app.use(cookieParser());

  // Global prefix
  app.setGlobalPrefix('');

  // Validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      exceptionFactory: (errors) => {
        const details: Record<string, string[]> = {};
        const messages: string[] = [];
        for (const err of errors) {
          const constraints = err.constraints || {};
          const propertyMessages = Object.values(constraints);
          details[err.property] = propertyMessages;
          messages.push(...propertyMessages);
        }
        const logger = new Logger('ValidationPipe');
        logger.warn(`Validation failed: ${JSON.stringify(details)}`);
        return new BadRequestException({
          code: 'VALIDATION_ERROR',
          message: messages.join(', ') || 'Validation failed',
          details,
        });
      },
    }),
  );

  // Global exception filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // Global transform interceptor
  app.useGlobalInterceptors(new TransformInterceptor());

  // Swagger API documentation
  const config = new DocumentBuilder()
    .setTitle('MADAR Platform API')
    .setDescription('AI-Powered Recruitment Platform - REST API Documentation')
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter JWT access token',
      },
      'JWT-auth',
    )
    .addTag('Authentication', 'Auth endpoints for registration, login, tokens')
    .addTag('Students', 'Student profile management')
    .addTag('Companies', 'Company and job management')
    .addTag('Universities', 'University dashboard and analytics')
    .addTag('Jobs', 'Public job listings and applications')
    .addTag('Applications', 'Application tracking and management')
    .addTag('Skills', 'Global skill taxonomy')
    .addTag('Matching', 'AI-powered job-student matching')
    .addTag('Support', 'Public contact and support requests')
    .addTag('Admin - Users', 'Admin user management')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');

  logger.log(`MADAR API server running on port ${port}`);
  logger.log(`Swagger docs available at http://localhost:${port}/api/docs`);
  logger.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
}

bootstrap();
