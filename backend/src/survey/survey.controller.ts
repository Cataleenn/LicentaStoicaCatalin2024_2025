import { Controller, Get, Post, Body, Param, NotFoundException } from '@nestjs/common';
import { SurveyService } from './survey.service';
import { Survey } from './survey.entity';
import { CreateSurveyDto } from './create-survey.dto';

@Controller('survey')
export class SurveyController {
  constructor(private readonly surveyService: SurveyService) {}

  @Get(':id')
  async getSurveyById(@Param('id') id: number) {
    if (isNaN(id)) {
      throw new NotFoundException('Chestionarul nu a fost găsit.');
    }
    return this.surveyService.getSurveyById(id);
  }

  @Post()
  async createSurvey(@Body() createSurveyDto: CreateSurveyDto): Promise<Survey> {
    return this.surveyService.createSurvey(createSurveyDto);
  }
}
