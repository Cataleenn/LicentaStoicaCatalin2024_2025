// src/survey/response.entity.ts
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Survey } from './survey.entity';

@Entity('survey_responses')
export class Response {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column('jsonb')
  answers: Record<string, any>;

  @Column({ default: false })
  isComplete: boolean;

  @Column({ type: 'jsonb', nullable: true }) 
  assembly: {
    rotations: number;
    componentsPlaced: { componentId: string; slotId: string }[];
  };

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Survey, survey => survey.responses)
  @JoinColumn({ name: 'survey_id' }) 
  survey: Survey;
}
