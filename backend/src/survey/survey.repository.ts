import { EntityRepository, Repository } from 'typeorm';
import { Survey } from './survey.entity';

@EntityRepository(Survey)
export class SurveyRepository extends Repository<Survey> {
  
}
