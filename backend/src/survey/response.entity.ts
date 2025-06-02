// Updated Response Entity - backend/src/survey/response.entity.ts
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
  assembly?: {
    rotations: number;
    componentsPlaced: Array<{ componentId: string; slotId: string; order: number }>;
    piecesRemovedCount: number;
    piecesSwappedCount: number;
    wrongPlacementsCount: number;
    correctPlacementsCount: number;
    optimalPlacementsCount: number;
    correctnessPercentage: number;
    totalMoves: number;
    timeSpent: number;
    detailedStats?: any;
  };

  // Add the missing fields for enhanced analytics
  @Column({ type: 'jsonb', nullable: true })
  demographicProfile?: {
    ageGroup: string;
    gender: string;
    educationLevel: string;
    occupation: string;
    stemFamiliarity: string;
  };

  @Column({ type: 'jsonb', nullable: true })
  behavioralProfile?: {
    problemSolvingStyle: string;
    techComfort: string;
    assemblyExperience: string;
    errorHandlingStyle: string;
    gamingFrequency: string;
  };

  @Column({ type: 'jsonb', nullable: true })
  computedMetrics?: {
    speedIndex: number;
    precisionIndex: number;
    efficiencyIndex: number;
    confidenceIndex: number;
    systematicIndex: number;
    persistenceIndex: number;
    adaptabilityIndex: number;
    explorationIndex: number;
    planningIndex: number;
    recoveryIndex: number;
    impulsivityIndex: number;
    frustrationTolerance: number;
    technicalAptitude: number;
  };

  @Column({ type: 'int', nullable: true })
  clusterAssignment?: number;

  @Column({ type: 'jsonb', nullable: true })
  clusterMetadata?: {
    confidence: number;
    distanceToCenter: number;
    nearestClusters: number[];
  };

  @CreateDateColumn()
  createdAt: Date;

  // Add submittedAt field that was missing
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  submittedAt: Date;

  @ManyToOne(() => Survey, survey => survey.responses, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'survey_id' })
  survey: Survey;
}