import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  
  async deleteUserAndResetIds(userId: number): Promise<void> {
    console.log(`Deleting user with ID: ${userId}`); 

    const result = await this.usersRepository.delete(userId);
    console.log(`Delete result:`, result); 

    await this.usersRepository.query(
        `SELECT setval('user_id_seq', COALESCE((SELECT MAX(id) FROM "user"), 1), false);`
    );

    console.log(`ID sequence reset completed.`); 
}

}
