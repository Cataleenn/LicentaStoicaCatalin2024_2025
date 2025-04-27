import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity()
export class Survey {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  formTitle: string;

  @Column({ nullable: true })
  description: string;

  @Column('jsonb')
  questions: any[];

  @CreateDateColumn()
  createdAt: Date;
}
