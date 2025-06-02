// Updated Survey Module - backend/src/survey/survey.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';

// Controllers
import { SurveyController } from './survey.controller';
import { ResponseController } from './response.controller';
// Comentăm pe cele care nu sunt create încă
// import { TestMappingController } from './test-mapping.controller';
// import { SimpleDebugController } from './simple-debug.controller';

// Services
import { SurveyService } from './survey.service';
import { ResponseService } from './response.service';
import { EnhancedResponseService } from './enhanced-response.service';

// Entities
import { Survey } from './survey.entity';
import { Response } from './response.entity';
import { User } from '../user/user.entity';

// Guards
import { AdminGuard } from '../admin/admin.guard';

// Clustering services
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
    // Comentăm pe cele care nu sunt create încă
    // TestMappingController,
    // SimpleDebugController
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