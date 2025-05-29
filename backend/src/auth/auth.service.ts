import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../user/user.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    // ✅ Încarcă utilizatorul CU parola explicit
    const user = await this.usersRepository.findOne({ 
      where: { email },
      select: ['id', 'email', 'name', 'role', 'password'] // Include explicit password
    });

    console.log('🔍 User găsit:', user ? 'DA' : 'NU');
    
    if (!user) {
      console.log('❌ Utilizator nu există');
      throw new UnauthorizedException('Invalid credentials');
    }

    console.log('🔍 Password din DB:', user.password ? 'EXISTS' : 'NULL/UNDEFINED');
    console.log('🔍 Password input:', password ? 'EXISTS' : 'NULL/UNDEFINED');

    if (!user.password) {
      console.log('❌ Password NULL în baza de date');
      throw new UnauthorizedException('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    console.log('🔍 Password match:', isMatch);
    
    if (!isMatch) {
      console.log('❌ Password nu se potrivește');
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.role !== 'admin') {
      console.log('❌ Nu este admin');
      throw new UnauthorizedException('Access restricted to administrators only');
    }

    console.log('✅ Validare reușită');
    return { id: user.id, email: user.email, role: user.role, name: user.name };
  }

  async login(user: any) {
    const payload = { id: user.id, email: user.email, role: user.role, name: user.name };
    console.log('🔍 user.name:', user.name);

    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}