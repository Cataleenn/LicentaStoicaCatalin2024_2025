import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Survey } from './survey.entity';
import { User } from '../user/user.entity';
import { Response } from './response.entity';
import { CreateSurveyDto } from './create-survey.dto';

@Injectable()
export class SurveyService {
  constructor(
    @InjectRepository(Survey)
    private readonly surveyRepository: Repository<Survey>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Response)
    private readonly responseRepository: Repository<Response>,
  ) {}


  async createSurvey(createSurveyDto: CreateSurveyDto, userId?: number): Promise<Survey> {
   
    const survey = new Survey();
    survey.formTitle = createSurveyDto.formTitle;
    survey.adminDescription = createSurveyDto.adminDescription;
    survey.userInstructions = createSurveyDto.userInstructions;

    survey.questions = createSurveyDto.questions;
    
    if (userId) {
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (user) {
        survey.createdBy = user;
        survey.createdById = userId;
      }
    }
    
    return await this.surveyRepository.save(survey);
  }


  async getAllSurveys(): Promise<Survey[]> {
    return await this.surveyRepository.find({
      relations: ['createdBy', 'responses'],
      order: { createdAt: 'DESC' }
    });
  }

  async getSurveyById(id: number): Promise<Survey> {
  const survey = await this.surveyRepository.findOne({
    where: { id }
  });

  if (!survey) {
    throw new NotFoundException(`Survey with ID ${id} not found`);
  }

  return survey;
}


  async getSurveysByUser(userId: number): Promise<Survey[]> {
    return await this.surveyRepository.find({
      where: { createdById: userId },
      relations: ['createdBy', 'responses'],
      order: { createdAt: 'DESC' }
    });
  }


  async getSurveyResponses(surveyId: number): Promise<any> {
    const survey = await this.surveyRepository.findOne({
      where: { id: surveyId },
      relations: ['createdBy']
    });

    if (!survey) {
      throw new NotFoundException('Chestionarul nu a fost găsit.');
    }

    const responses = await this.responseRepository.find({
      where: { survey: { id: surveyId } },
      order: { createdAt: 'DESC' }
    });

  
    const processedResponses = responses.map(response => ({
      id: response.id,
      userId: response.userId,
      answers: response.answers,
      assembly: response.assembly,
      isComplete: response.isComplete,
      createdAt: response.createdAt,
      processedAnswers: this.processAnswersWithQuestions(response.answers, survey.questions || {})
    }));

    return {
      survey: {
        id: survey.id,
        formTitle: survey.formTitle,
        adminDescription: survey.adminDescription,
        userInstructions: survey.userInstructions,
        questions: survey.questions,
        createdBy: survey.createdBy,
        createdAt: survey.createdAt
      },
      responses: processedResponses,
      totalResponses: responses.length,
      completedResponses: responses.filter(r => r.isComplete).length
    };
  }


  private processAnswersWithQuestions(answers: Record<string, any>, questions: Record<string, string>): any[] {
  const processed: any[] = [];
  
  Object.keys(answers).forEach(questionIndex => {
   
    const questionText = questions[questionIndex];
    
    if (questionText) {
      processed.push({
        questionNumber: questionIndex,
        questionText: questionText,        
        questionType: 'text',             
        answer: answers[questionIndex],
        options: []                     
      });
    }
  });
  
  return processed;
}

 
  async deleteSurvey(surveyId: number, userId: number, userRole: string): Promise<{ message: string }> {
    const survey = await this.surveyRepository.findOne({
      where: { id: surveyId },
      relations: ['createdBy', 'responses']
    });

    if (!survey) {
      throw new NotFoundException('Chestionarul nu a fost găsit.');
    }

  
    if (userRole !== 'admin' && survey.createdById !== userId) {
      throw new ForbiddenException('Nu aveți permisiunea să ștergeți acest chestionar.');
    }

    const responseCount = survey.responses?.length || 0;

 
    if (responseCount > 0) {
      await this.responseRepository.delete({ survey: { id: surveyId } });
    }


    await this.surveyRepository.delete(surveyId);

    let message = `Chestionarul "${survey.formTitle}" a fost șters cu succes`;
    if (responseCount > 0) {
      message += `, împreună cu ${responseCount} răspuns${responseCount > 1 ? 'uri' : ''}`;
    }
    message += '.';

    return { message };
  }

  async getSurveyStats(): Promise<{
    totalSurveys: number;
    totalResponses: number;
    recentSurveys: Survey[];
  }> {
    const totalSurveys = await this.surveyRepository.count();
    const totalResponses = await this.responseRepository.count();
    
    const recentSurveys = await this.surveyRepository.find({
      relations: ['createdBy', 'responses'],
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