import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { SurveyService } from './survey.service';
import { Survey } from './survey.entity';

@Controller('survey')
export class SurveyController {
  constructor(private readonly surveyService: SurveyService) {}

  @Post()
  async createSurvey(@Body() surveyData: Partial<Survey>): Promise<Survey> {
    return this.surveyService.createSurvey(surveyData);
  }

  @Get(':id')
  async getSurveyById(@Param('id') id: number): Promise<Survey> {
    return this.surveyService.getSurveyById(id);
  }

  @Get()
  async getAllSurveys(): Promise<Survey[]> {
    return this.surveyService.getAllSurveys();
  }

  @Put(':id')
  async updateSurvey(@Param('id') id: number, @Body() surveyData: Partial<Survey>): Promise<Survey> {
    return this.surveyService.updateSurvey(id, surveyData);
  }

  @Delete(':id')
  async deleteSurvey(@Param('id') id: number): Promise<void> {
    return this.surveyService.deleteSurvey(id);
  }
}
