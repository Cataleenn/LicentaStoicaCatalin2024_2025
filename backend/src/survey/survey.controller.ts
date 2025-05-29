import { Controller, Get, Post, Body, Param, NotFoundException, UseGuards, Request } from '@nestjs/common';
import { SurveyService } from './survey.service';
import { Survey } from './survey.entity';
import { CreateSurveyDto } from './create-survey.dto';
import { AdminGuard } from '../admin/admin.guard';

@Controller('survey')
export class SurveyController {
  constructor(private readonly surveyService: SurveyService) {}

  @Get()
  @UseGuards(AdminGuard)
  async getAllSurveys(): Promise<Survey[]> {
    return this.surveyService.getAllSurveys();
  }

  @Get('stats')
  @UseGuards(AdminGuard)
  async getSurveyStats() {
    return this.surveyService.getSurveyStats();
  }

  @Get(':id')
  async getSurveyById(@Param('id') id: number) {
    if (isNaN(id)) {
      throw new NotFoundException('Chestionarul nu a fost găsit.');
    }
    return this.surveyService.getSurveyById(id);
  }

  @Post()
  @UseGuards(AdminGuard)
  async createSurvey(
    @Body() createSurveyDto: CreateSurveyDto,
    @Request() req: any
  ): Promise<Survey> {
    const userId = req.user?.id;
    return this.surveyService.createSurvey(createSurveyDto, userId);
  }
}