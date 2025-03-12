import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ✅ Activează CORS pentru a permite accesul frontend-ului
  app.enableCors({
    origin: 'http://localhost:4200', // ✅ Permite acces doar de la frontend-ul tău
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: 'Content-Type, Authorization'
  });

  await app.listen(3000);
}
bootstrap();
