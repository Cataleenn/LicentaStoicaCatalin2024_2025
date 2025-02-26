import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity()
export class Survey {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  formTitle: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'jsonb' }) // Stocăm întrebările ca JSONB
  questions: any;

  @Column({ type: 'jsonb' }) // Stocăm datele respondentului
  respondent: any;

  @Column({ type: 'jsonb' }) // Stocăm progresul utilizatorului
  progress: any;

  @CreateDateColumn()
  createdAt: Date;
}
