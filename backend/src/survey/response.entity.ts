// src/survey/response.entity.ts

import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Survey } from './survey.entity'; // Asigură-te că entitatea Survey este corect definită

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

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Survey, survey => survey.responses)
  @JoinColumn({ name: 'survey_id' }) // poate fi și 'form_id' dacă ai așa în DB
  survey: Survey;
}
