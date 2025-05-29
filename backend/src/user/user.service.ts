import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import * as bcrypt from 'bcrypt';

interface CreateAdminDto {
  name: string;
  email: string;
  password: string;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  // Obține toți administratorii
  async getAllAdmins(): Promise<User[]> {
    return this.usersRepository.find({
      where: { role: 'admin' },
      select: ['id', 'name', 'email', 'role'], // Exclude explicit parola
      order: { id: 'DESC' }
    });
  }

  // Creează un administrator nou
  async createAdmin(createAdminDto: CreateAdminDto): Promise<User> {
    const { name, email, password } = createAdminDto;

    // Verifică dacă email-ul există deja
    const existingUser = await this.usersRepository.findOne({ 
      where: { email } 
    });

    if (existingUser) {
      throw new ConflictException('Un utilizator cu acest email există deja');
    }

    // Validări suplimentare
    if (!name || name.trim().length < 2) {
      throw new ConflictException('Numele trebuie să aibă minim 2 caractere');
    }

    if (!password || password.length < 6) {
      throw new ConflictException('Parola trebuie să aibă minim 6 caractere');
    }

    // Verifică formatul email-ului
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new ConflictException('Format email invalid');
    }

    // Hash parola
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Creează utilizatorul
    const newAdmin = this.usersRepository.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: 'admin'
    });

    const savedAdmin = await this.usersRepository.save(newAdmin);

    // Returnează utilizatorul fără parolă
    const { password: _, ...adminWithoutPassword } = savedAdmin;
    return adminWithoutPassword as User;
  }

  // Obține un utilizator după ID
  async getUserById(userId: number): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      select: ['id', 'name', 'email', 'role'] // Exclude explicit parola
    });

    if (!user) {
      throw new NotFoundException(`Utilizatorul cu ID ${userId} nu a fost găsit`);
    }

    return user;
  }

  // Șterge un utilizator și resetează secvența ID-urilor
  async deleteUserAndResetIds(userId: number): Promise<void> {
    console.log(`Deleting user with ID: ${userId}`); 

    // Verifică dacă utilizatorul există
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`Utilizatorul cu ID ${userId} nu a fost găsit`);
    }

    // Verifică că nu este ultimul admin
    const adminCount = await this.usersRepository.count({ where: { role: 'admin' } });
    if (user.role === 'admin' && adminCount <= 1) {
      throw new ConflictException('Nu poți șterge ultimul administrator din sistem');
    }

    const result = await this.usersRepository.delete(userId);
    console.log(`Delete result:`, result); 

    // Resetează secvența ID-urilor
    await this.usersRepository.query(
        `SELECT setval('user_id_seq', COALESCE((SELECT MAX(id) FROM "user"), 1), false);`
    );

    console.log(`ID sequence reset completed.`); 
  }

  // Actualizează un utilizator
  async updateUser(userId: number, updateData: Partial<User>): Promise<User> {
    const user = await this.getUserById(userId);

    // Dacă se actualizează email-ul, verifică unicitatea
    if (updateData.email && updateData.email !== user.email) {
      const existingUser = await this.usersRepository.findOne({ 
        where: { email: updateData.email } 
      });
      
      if (existingUser) {
        throw new ConflictException('Un utilizator cu acest email există deja');
      }
    }

    // Dacă se actualizează parola, hash-uiește-o
    if (updateData.password) {
      const saltRounds = 10;
      updateData.password = await bcrypt.hash(updateData.password, saltRounds);
    }

    await this.usersRepository.update(userId, updateData);
    return this.getUserById(userId);
  }

  // Obține statistici utilizatori
  async getUserStats(): Promise<{
    totalUsers: number;
    totalAdmins: number;
  }> {
    const totalUsers = await this.usersRepository.count();
    const totalAdmins = await this.usersRepository.count({ where: { role: 'admin' } });

    return {
      totalUsers,
      totalAdmins
    };
  }
}