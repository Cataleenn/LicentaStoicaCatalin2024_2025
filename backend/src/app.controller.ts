import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getHello(): string {
    return 'Serverul rulează cu succes! 🚀';
  }
  @Get('ping')
ping() {
  return { message: 'pong' };
}
}
