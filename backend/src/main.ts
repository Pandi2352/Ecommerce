import 'reflect-metadata';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { UPLOAD_DIR, UPLOAD_ROUTE } from './modules/uploads/uploads.constants';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get(ConfigService);

  // Trust the first proxy hop (nginx) so `req.ip` reflects the real client, not the proxy.
  app.set('trust proxy', 1);

  // Serve locally-uploaded files (avatars, logos) at /uploads.
  app.useStaticAssets(UPLOAD_DIR, { prefix: `${UPLOAD_ROUTE}/` });

  const prefix = config.get<string>('API_PREFIX', '/api');
  app.setGlobalPrefix(prefix.replace(/^\//, ''));
  // Security headers (this is a JSON API consumed cross-origin by the SPA).
  app.use(
    helmet({
      contentSecurityPolicy: { directives: { defaultSrc: ["'none'"], frameAncestors: ["'none'"] } },
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
  app.enableCors({ origin: config.get<string>('CLIENT_ORIGIN'), credentials: true });
  app.use(cookieParser());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new AllExceptionsFilter());

  const port = config.get<number>('PORT', 4000);
  await app.listen(port);
  new Logger('Bootstrap').log(`API ready on http://localhost:${port}${prefix}`);
}

void bootstrap();
