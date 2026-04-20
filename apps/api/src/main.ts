import './bootstrap-env';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LocalizeResponseInterceptor } from './common/interceptors/localize-response.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Security — allow browser clients on another origin/port (web on :3000, API on :3001).
  // Helmet defaults to CORP same-origin, which blocks credentialed cross-origin fetch responses.
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
  app.use(cookieParser());

  // CORS — comma-separated origins; localhost vs 127.0.0.1 must both be listed if you use both
  const corsRaw = configService.get<string>('CORS_ORIGIN') || 'http://localhost:3000';
  const corsOrigins = corsRaw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  app.enableCors({
    origin: corsOrigins.length <= 1 ? corsOrigins[0] : corsOrigins,
    credentials: true,
  });

  // Global prefix
  const apiPrefix = configService.get('API_PREFIX') || 'api/v1';
  app.setGlobalPrefix(apiPrefix);

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    })
  );

  // Global filters and interceptors
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new LocalizeResponseInterceptor());

  // Swagger documentation
  if (configService.get('NODE_ENV') !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Enterprise Hackathon Management System API')
      .setDescription('Bilingual (Arabic RTL + English LTR) hackathon management API')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('auth', 'Authentication endpoints')
      .addTag('users', 'User management')
      .addTag('events', 'Event management')
      .addTag('teams', 'Team management')
      .addTag('submissions', 'Submission management')
      .addTag('judging', 'Judging and scoring')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  const port = configService.get('PORT') || 3001;
  await app.listen(port);

  console.log(`🚀 EHMS API running on http://localhost:${port}/${apiPrefix}`);
  console.log(`📚 API docs available at http://localhost:${port}/api/docs`);
}

bootstrap();
