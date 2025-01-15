// src/auth/repositories/password-reset-token.repository.ts
import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { PasswordReset } from 'src/users/Entities/password-reset-token.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class PasswordResetRepository {
  constructor(
    @InjectRepository(PasswordReset)
    private repository: Repository<PasswordReset>,
  ) {}

  async save(resetToken: PasswordReset): Promise<PasswordReset> {
    return this.repository.save(resetToken);
  }

  async findOne(options: any): Promise<PasswordReset | null> {
    return this.repository.findOne(options);
  }

  async find(options: any): Promise<PasswordReset[]> {
    return this.repository.find(options);
  }

  async update(criteria: any, data: Partial<PasswordReset>): Promise<void> {
    await this.repository.update(criteria, data);
  }

  async create(data: Partial<PasswordReset>): Promise<PasswordReset> {
    const resetToken = this.repository.create(data);
    return this.repository.save(resetToken);
  }

  async delete(criteria: any): Promise<void> {
    await this.repository.delete(criteria);
  }
}
