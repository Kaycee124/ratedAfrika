// src/auth/repositories/email-verification-token.repository.ts
import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { EmailVerificationToken } from 'src/users/Entities/email-verification.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class EmailVerificationTokenRepository {
  constructor(
    @InjectRepository(EmailVerificationToken)
    private repository: Repository<EmailVerificationToken>,
  ) {}

  async save(token: EmailVerificationToken): Promise<EmailVerificationToken> {
    return this.repository.save(token);
  }

  async findOne(options: any): Promise<EmailVerificationToken | null> {
    return this.repository.findOne(options);
  }

  async update(
    criteria: any,
    data: Partial<EmailVerificationToken>,
  ): Promise<void> {
    await this.repository.update(criteria, data);
  }

  async delete(criteria: any): Promise<void> {
    await this.repository.delete(criteria);
  }

  async create(
    data: Partial<EmailVerificationToken>,
  ): Promise<EmailVerificationToken> {
    const token = this.repository.create(data);
    return this.repository.save(token);
  }
}
export { EmailVerificationToken };
