import { Controller, Post, Body } from '@nestjs/common';
import { SurveyService } from './survey.service';
import { CreateSurveyDto } from './create-survey.dto';

@Controller('survey')
export class SurveyController {
  constructor(private readonly surveyService: SurveyService) {}

  @Post()
  async createSurvey(@Body() createSurveyDto: CreateSurveyDto) {
    return this.surveyService.createSurvey(createSurveyDto);
  }
}
