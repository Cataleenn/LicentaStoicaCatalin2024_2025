import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { Response } from './response.entity';

@Entity() // denumire explicită în DB, opțional
export class Survey {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  formTitle: string;

  @Column({ type: 'text', nullable: true })
  adminDescription?: string;

  @Column({ type: 'text', nullable: true })
  userInstructions?: string;

  @Column('jsonb')
  questions: any[];

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => Response, (response) => response.survey, { cascade: true })
  responses: Response[];
}
