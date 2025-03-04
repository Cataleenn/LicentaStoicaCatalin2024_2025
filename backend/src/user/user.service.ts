import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
//!!! posibil sa nu mai trebuiasca deocamdata partea asta
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  // ✅ Metodă pentru ștergerea utilizatorului și resetarea ID-ului
  async deleteUserAndResetIds(userId: number): Promise<void> {
    console.log(`Deleting user with ID: ${userId}`); // ✅ Log pentru debugging

    const result = await this.usersRepository.delete(userId);
    console.log(`Delete result:`, result); // ✅ Log pentru a verifica rezultatul ștergerii

    await this.usersRepository.query(
        `SELECT setval('user_id_seq', COALESCE((SELECT MAX(id) FROM "user"), 1), false);`
    );

    console.log(`ID sequence reset completed.`); // ✅ Log pentru a confirma resetarea ID-ului
}

}
