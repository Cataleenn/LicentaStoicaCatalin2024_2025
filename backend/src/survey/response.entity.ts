// Enhanced Response Entity pentru backend
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
    componentsPlaced: { componentId: string; slotId: string; order: number }[];
    piecesRemovedCount: number;        // de câte ori au fost scoase piese
    piecesSwappedCount: number;        // de câte ori au fost interschimbate
    wrongPlacementsCount: number;      // câte plasări greșite
    correctnessPercentage: number;     // procentaj de corectitudine (0-100)
    totalMoves: number;                // numărul total de mișcări
    timeSpent: number;                 // timpul petrecut în secunde
  };

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Survey, survey => survey.responses)
  @JoinColumn({ name: 'survey_id' }) 
  survey: Survey;
}