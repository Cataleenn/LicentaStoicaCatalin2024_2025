import { Controller, Post, Body } from '@nestjs/common';
import { SurveyService } from './survey.service';
import { CreateSurveyDto } from './create-survey.dto';

@Controller('survey')  // Prefixul pentru rutele backend
export class SurveyController {
  constructor(private readonly surveyService: SurveyService) {}

  @Post()
  createSurvey(@Body() createSurveyDto: CreateSurveyDto) {
    return this.surveyService.createSurvey(createSurveyDto);
  }
}
