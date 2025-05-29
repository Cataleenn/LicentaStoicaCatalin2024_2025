import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  name: string;

  @Column() // Eliminăm select: false pentru a putea încărca parola când avem nevoie
  password: string;

  @Column({ default: 'user' }) 
  role: string;
}