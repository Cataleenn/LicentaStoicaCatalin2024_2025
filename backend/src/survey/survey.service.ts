import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Survey } from './survey.entity';
import { CreateSurveyDto } from './create-survey.dto';

@Injectable()
export class SurveyService {
  constructor(
    @InjectRepository(Survey)  // Asigură-te că folosești corect @InjectRepository
    private readonly surveyRepository: Repository<Survey>,  // SurveyRepository
  ) {}

  async createSurvey(createSurveyDto: CreateSurveyDto): Promise<Survey> {
    const newSurvey = this.surveyRepository.create(createSurveyDto);  // Folosește repository-ul corect
    await this.surveyRepository.save(newSurvey);
    return newSurvey;
  }

  // Altele...
}
