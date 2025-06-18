import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Response } from './response.entity';
import { User } from '../user/user.entity';

@Entity()
export class Survey {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  formTitle: string;

  @Column({ type: 'text', nullable: true })
  adminDescription?: string;

  @Column({ type: 'text', nullable: true })
  userInstructions?: string;

   @Column('json', { nullable: true })
  questions?: Record<string, string>;

  @Column({ default: false })
  required: boolean;

  @CreateDateColumn()
  createdAt: Date;

  // Add relationship to User who created the survey
  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'created_by' })
  createdBy: User;

  @Column({ name: 'created_by', nullable: true })
  createdById: number;

  @OneToMany(() => Response, (response) => response.survey, { cascade: true })
  responses: Response[];
}