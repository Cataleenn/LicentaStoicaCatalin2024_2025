import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Survey } from './survey.entity';
import { CreateSurveyDto } from './create-survey.dto';

@Injectable()
export class SurveyService {
  constructor(
    @InjectRepository(Survey)
    private readonly surveyRepository: Repository<Survey>,
  ) {}

  async createSurvey(createSurveyDto: CreateSurveyDto): Promise<Survey> {
    const survey = this.surveyRepository.create(createSurveyDto);
    await this.surveyRepository.save(survey);
    return survey;
  }
}
