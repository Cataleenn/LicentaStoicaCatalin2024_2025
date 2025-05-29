import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ✅ Activează CORS pentru a permite accesul frontend-ului
  app.enableCors({
    origin: ['http://localhost:4200', 'http://192.168.100.16:4200'], // Permite acces doar de la frontend-ul tău
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: 'Content-Type, Authorization'
  });

  app.setGlobalPrefix('api');  // Asigură-te că prefixul 'api' este setat

  await app.listen(3000);  // Ascultă pe portul 3000
}
bootstrap();
