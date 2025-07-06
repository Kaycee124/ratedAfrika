import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { HttpErrorFilter } from './errors/globalfilter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe()); // Ensures validation works globally
  app.useGlobalFilters(new HttpErrorFilter());

  // Configure CORS properly for both development and production
  const isDevelopment = process.env.NODE_ENV !== 'production';

  // Common development origins that frontend developers use
  const developmentOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://localhost:4200', // Angular
    'http://localhost:5173', // Vite
    'http://localhost:8080', // Vue.js
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    'http://127.0.0.1:3002',
    'http://127.0.0.1:4200',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:8080',
  ];

  // Production origins from environment variable
  const productionOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];

  // Combine origins based on environment
  const allowedOrigins = isDevelopment
    ? [...developmentOrigins, ...productionOrigins]
    : productionOrigins;

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or server-to-server)
      if (!origin && isDevelopment) {
        return callback(null, true);
      }

      // Check if origin is in our allowed list
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // In development, be more permissive (but log unknown origins)
      if (isDevelopment) {
        console.log(`Warning: Unknown origin in development: ${origin}`);
        return callback(null, true);
      }

      // In production, strictly reject unknown origins
      console.error(`CORS blocked origin: ${origin}`);
      return callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Accept',
      'Authorization',
      'Content-Type',
      'X-Requested-With',
      'Range',
    ],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  // Use environment provided port or fallback to 3000
  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
  console.log(`Environment: ${isDevelopment ? 'Development' : 'Production'}`);
  console.log(`CORS enabled for origins: ${allowedOrigins.join(', ')}`);
}
bootstrap();
