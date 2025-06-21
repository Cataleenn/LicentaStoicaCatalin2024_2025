
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { SurveyController } from './survey.controller';
import { ResponseController } from './response.controller';
import { SurveyService } from './survey.service';
import { ResponseService } from './response.service';
import { EnhancedResponseService } from './enhanced-response.service';
import { Survey } from './survey.entity';
import { Response } from './response.entity';
import { User } from '../user/user.entity';
import { AdminGuard } from '../admin/admin.guard';


import { FeatureEngineeringService } from '../clustering/feature-engineering.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Survey, Response, User]),
    JwtModule.register({
      secret: 'my_secret_key',
    }),
  ],
  controllers: [
    SurveyController,
    ResponseController
  ],
  providers: [
    SurveyService,
    ResponseService,
    EnhancedResponseService,
    FeatureEngineeringService,
    AdminGuard
  ],
  exports: [
    SurveyService,
    ResponseService,
    EnhancedResponseService,
    FeatureEngineeringService
  ]
})
export class SurveyModule {}