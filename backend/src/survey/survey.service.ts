import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Survey } from './survey.entity';
import { User } from '../user/user.entity';
import { CreateSurveyDto } from './create-survey.dto';

@Injectable()
export class SurveyService {
  constructor(
    @InjectRepository(Survey)
    private readonly surveyRepository: Repository<Survey>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  // Create a new survey with creator tracking
  async createSurvey(createSurveyDto: CreateSurveyDto, userId?: number): Promise<Survey> {
    const survey = this.surveyRepository.create(createSurveyDto);
    
    if (userId) {
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (user) {
        survey.createdBy = user;
        survey.createdById = userId;
      }
    }
    
    return await this.surveyRepository.save(survey);
  }

  // Get all surveys with creator information
  async getAllSurveys(): Promise<Survey[]> {
    return await this.surveyRepository.find({
      relations: ['createdBy'],
      order: { createdAt: 'DESC' }
    });
  }

  // Get survey by ID
  async getSurveyById(id: number): Promise<Survey> {
    return this.surveyRepository.findOneOrFail({ 
      where: { id },
      relations: ['createdBy']
    });
  }

  // Get surveys created by a specific user
  async getSurveysByUser(userId: number): Promise<Survey[]> {
    return await this.surveyRepository.find({
      where: { createdById: userId },
      relations: ['createdBy'],
      order: { createdAt: 'DESC' }
    });
  }

  // Get survey statistics
  async getSurveyStats(): Promise<{
    totalSurveys: number;
    totalResponses: number;
    recentSurveys: Survey[];
  }> {
    const totalSurveys = await this.surveyRepository.count();
    const totalResponses = await this.surveyRepository
      .createQueryBuilder('survey')
      .leftJoin('survey.responses', 'response')
      .getCount();
    
    const recentSurveys = await this.surveyRepository.find({
      relations: ['createdBy'],
      order: { createdAt: 'DESC' },
      take: 5
    });

    return {
      totalSurveys,
      totalResponses,
      recentSurveys
    };
  }
}