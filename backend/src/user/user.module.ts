import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { User } from './user.entity';
import { UsersService } from './user.service';
import { UsersController } from './user.controller';
import { AdminGuard } from '../admin/admin.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    JwtModule.register({
      secret: 'my_secret_key',  // Asigură-te că folosești același secret!
    }),
  ],
  controllers: [UsersController],
  providers: [UsersService, AdminGuard],
  exports: [UsersService], // Export pentru a fi folosit în alte module
})
export class UserModule {}