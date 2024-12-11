// src/auth/repositories/user.repository.ts
import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { User } from 'src/users/user.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class UserRepository {
  constructor(
    @InjectRepository(User)
    private repository: Repository<User>,
  ) {}

  async findByEmail(email: string): Promise<User | undefined> {
    return this.repository.findOne({ where: { email } });
  }

  async findById(id: string): Promise<User | undefined> {
    return this.repository.findOne({ where: { id } });
  }

  async save(user: User): Promise<User> {
    return this.repository.save(user);
  }

  async update(id: string, data: Partial<User>): Promise<void> {
    await this.repository.update(id, data);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
