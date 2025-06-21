import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);


  app.enableCors({
    origin: ['http://localhost:4200', 'http://192.168.100.16:4200','https://survey-assembler-ui-c11e0.web.app','https://licenta-stoica-catalin2024-2025.vercel.app'], // Permite acces doar de la frontend-ul tău
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: 'Content-Type, Authorization',
    credentials: true
  });

  app.setGlobalPrefix('api'); 

  const port = process.env.PORT;
console.log(' ENV PORT:', port);

await app.listen(port || 3000);
console.log(' Backend ready on port:', port || 3000);

}
bootstrap();
