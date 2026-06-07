import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: `https://${process.env.FRONTEND_URL}`,
  });
  const port = process.env.PORT ?? 3002;
  console.log('Starting on port:', port);
  await app.listen(port, '0.0.0.0');
}
bootstrap();