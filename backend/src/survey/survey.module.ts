import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SurveyController } from './survey.controller';
import { SurveyService } from './survey.service';
import { SurveyRepository } from './survey.repository';  
import { Survey } from './survey.entity';
import { Response } from './response.entity';
import { ResponseController } from './response.controller';
import { ResponseService } from './response.service';
import { User } from '../user/user.entity';
import { JwtModule } from '@nestjs/jwt';
import { AdminGuard } from '../admin/admin.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([Survey, SurveyRepository, Response, User]),
    JwtModule.register({
      secret: 'my_secret_key',
    }),
  ],  
  controllers: [SurveyController, ResponseController],
  providers: [SurveyService, SurveyRepository, ResponseService, AdminGuard],  
})
export class SurveyModule {}