import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SurveyController } from './survey.controller';
import { SurveyService } from './survey.service';
import { SurveyRepository } from './survey.repository';  // Importă repository-ul
import { Survey } from './survey.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Survey, SurveyRepository])],  // Adaugă SurveyRepository în imports
  controllers: [SurveyController],
  providers: [SurveyService, SurveyRepository],  // Adaugă SurveyRepository în providers
})
export class SurveyModule {}
