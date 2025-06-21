import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AuthModule } from '../auth/auth.module'; 
import { AdminGuard } from './admin.guard';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    AuthModule,
    JwtModule.register({
      secret: 'my_secret_key',  
    }),
  ],
  controllers: [AdminController],
  providers: [AdminGuard],
})
export class AdminModule {}
