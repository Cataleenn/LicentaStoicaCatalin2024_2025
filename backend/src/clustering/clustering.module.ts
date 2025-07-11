
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';


import { Response } from '../survey/response.entity';
import { Survey } from '../survey/survey.entity';


import { ClusteringService } from './clustering.service';
import { FeatureEngineeringService } from './feature-engineering.service';
import { SimpleFisherService } from './simple-fisher.service';
import { EnhancedResponseService } from '../survey/enhanced-response.service';


import { ClusteringController } from './clustering.controller';
import { SimpleFisherController } from './simple-fisher.controller';


import { AdminGuard } from '../admin/admin.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([Response, Survey]),
    JwtModule.register({
      secret: 'my_secret_key',
    }),
  ],
  controllers: [
    ClusteringController,
    SimpleFisherController
  ],
  providers: [
    ClusteringService,
    FeatureEngineeringService,
    SimpleFisherService,
    EnhancedResponseService,
    AdminGuard
  ],
  exports: [
    ClusteringService,
    FeatureEngineeringService,
    SimpleFisherService
  ]
})
export class ClusteringModule {}