import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SurveyController } from './survey.controller';
import { SurveyService } from './survey.service';
import { SurveyRepository } from './survey.repository';  // Importă repository-ul
import { Survey } from './survey.entity';
import { Response } from './response.entity';
import { ResponseController } from './response.controller';
import { ResponseService } from './response.service';

@Module({
  imports: [TypeOrmModule.forFeature([Survey, SurveyRepository, Response])],  // Adaugă SurveyRepository în imports
  controllers: [SurveyController,ResponseController],
  providers: [SurveyService, SurveyRepository,ResponseService],  // Adaugă SurveyRepository în providers
})
export class SurveyModule {}
