import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Survey } from './survey.entity';

@Injectable()
export class SurveyService {
  constructor(
    @InjectRepository(Survey)
    private readonly surveyRepository: Repository<Survey>,
  ) {}

  async createSurvey(surveyData: Partial<Survey>): Promise<Survey> {
    const survey = this.surveyRepository.create(surveyData);
    return this.surveyRepository.save(survey);
  }

  async getSurveyById(id: number): Promise<Survey> {
    return this.surveyRepository.findOneByOrFail( { id } );
  }

  async getAllSurveys(): Promise<Survey[]> {
    return this.surveyRepository.find();
  }

  async updateSurvey(id: number, surveyData: Partial<Survey>): Promise<Survey> {
    await this.surveyRepository.update(id, surveyData);
    return this.getSurveyById(id);
  }

  async deleteSurvey(id: number): Promise<void> {
    await this.surveyRepository.delete(id);
  }
}
