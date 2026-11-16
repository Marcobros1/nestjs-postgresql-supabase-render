import { existsSync } from 'node:fs';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import helmet from 'helmet';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AllExceptionsFilter } from './common/all-exceptions.filter';
import { requestLogger } from './common/request-logger';

// En tu ordenador, lee el .env. En Render no hay .env: las variables las pone Render.
if (existsSync('.env')) process.loadEnvFile();

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.use(helmet()); // cabeceras de seguridad en todas las respuestas


  // Todas las rutas empiezan por /api
  app.setGlobalPrefix('api');

  // Versiones en la URL: /api/v1/..., /api/v2/...
  app.enableVersioning({
    type: VersioningType.URI, // la versión va en la URL
    defaultVersion: '1', // la ruta que no diga nada es v1
  });

  app.use(requestLogger); // una línea en la consola por cada petición

  // Todos los errores con la misma forma
  app.useGlobalFilters(new AllExceptionsFilter());

  // Comprueba los DTO en todas las rutas
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // quita los campos que no estén en el DTO...
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors({ origin: `http://127.0.0.1:${process.env.WEB_PORT}` });

  // En Render, las peticiones llegan a través de un proxy:
  // así Express ve la IP de verdad de cada cliente
  app.set('trust proxy', 1);
  
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
