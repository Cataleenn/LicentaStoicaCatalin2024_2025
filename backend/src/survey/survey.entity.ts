import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany  } from 'typeorm';
import { Response } from './response.entity'; 

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

  @OneToMany(() => Response, (response) => response.survey)  // Legătura cu Response
  responses: Response[]
}
