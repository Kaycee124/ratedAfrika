/* eslint-disable @typescript-eslint/no-unused-vars */
/////////////////////////

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PasswordReset } from 'src/users/Entities/password-reset-token.entity';
import { EmailVerificationToken } from 'src/users/Entities/email-verification.entity';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { randomBytes, randomInt } from 'crypto';
import { User } from 'src/users/user.entity';

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    // Changed to standard TypeORM repositories
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(PasswordReset)
    private readonly passwordResetRepository: Repository<PasswordReset>,
    @InjectRepository(EmailVerificationToken)
    private readonly emailVerificationTokenRepository: Repository<EmailVerificationToken>,
  ) {}

  // Utility method for generating random tokens
  private generateRandomToken(length: number = 32): string {
    return randomBytes(length).toString('hex');
  }

  // Token versioning - now uses standard repository
  async invalidateTokens(userId: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (user) {
      user.tokenVersion += 1;
      await this.userRepository.save(user);
    }
  }

  // JWT Access Token generation
  async generateAccessToken(user: User): Promise<string> {
    const payload = {
      sub: user.id,
      tokenVersion: user.tokenVersion,
      email: user.email,
      name: user.name,
      subscription: user.subscription,
    };

    const secret = this.configService.get<string>('JWT_SECRET');
    if (!secret) {
      throw new Error('JWT_SECRET is not defined in token service');
    }
    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: '30m',
    });
  }

  // JWT Refresh Token generation
  async generateRefreshToken(user: User): Promise<string> {
    const payload = {
      sub: user.id,
      tokenVersion: user.tokenVersion,
      type: 'refresh',
    };
    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: '7d',
    });
  }

  // Access Token validation
  async validateAccessToken(token: string): Promise<any> {
    try {
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      const user = await this.userRepository.findOne({
        where: { id: payload.sub },
      });

      if (!user) return null;
      if (payload.tokenVersion !== user.tokenVersion) return null;

      return payload;
    } catch (error) {
      return null;
    }
  }

  // Refresh Token validation
  async validateRefreshToken(token: string): Promise<any> {
    try {
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      const user = await this.userRepository.findOne({
        where: { id: payload.sub },
      });

      if (!user) return null;
      if (payload.tokenVersion !== user.tokenVersion) return null;
      if (payload.type !== 'refresh') return null;

      return payload;
    } catch (error) {
      return null;
    }
  }

  // Email verification token generation
  async generateEmailVerificationToken(user: User): Promise<string> {
    const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create new verification token
    const emailVerificationToken = this.emailVerificationTokenRepository.create(
      {
        user,
        token: code,
        expiresAt,
        isUsed: false,
      },
    );

    await this.emailVerificationTokenRepository.save(emailVerificationToken);
    return code;
  }

  // Email verification token validation
  async validateEmailVerificationToken(code: string): Promise<string> {
    const emailVerificationToken =
      await this.emailVerificationTokenRepository.findOne({
        where: {
          token: code,
          isUsed: false,
        },
        relations: ['user'],
      });

    if (
      !emailVerificationToken ||
      emailVerificationToken.expiresAt < new Date()
    ) {
      throw new UnauthorizedException(
        'Invalid or expired email verification code.',
      );
    }

    return emailVerificationToken.user.id;
  }

  // Mark email verification token as used
  async markEmailVerificationTokenAsUsed(token: string): Promise<void> {
    await this.emailVerificationTokenRepository.update(
      { token },
      { isUsed: true },
    );
  }

  // Password reset code generation
  async generatePasswordResetCode(user: User): Promise<string> {
    // Invalidate existing reset codes
    await this.passwordResetRepository.update(
      {
        user: { id: user.id },
        isUsed: false,
      },
      { isUsed: true },
    );

    const resetCode = randomInt(100000, 999999).toString(); // 6-digit code
    const hashedResetCode = await bcrypt.hash(resetCode, 10);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    const passwordReset = this.passwordResetRepository.create({
      user,
      resetCode: hashedResetCode,
      expiresAt,
      isUsed: false,
    });

    await this.passwordResetRepository.save(passwordReset);
    return resetCode;
  }

  // Password reset code validation
  async validatePasswordResetCode(resetCode: string): Promise<string> {
    const passwordResets = await this.passwordResetRepository.find({
      where: { isUsed: false },
      relations: ['user'],
    });

    for (const passwordReset of passwordResets) {
      const isMatch = await bcrypt.compare(resetCode, passwordReset.resetCode);
      if (isMatch && passwordReset.expiresAt > new Date()) {
        return passwordReset.user.id;
      }
    }

    throw new UnauthorizedException('Invalid or expired password reset code.');
  }

  // Mark password reset code as used
  async markPasswordResetCodeAsUsed(resetCode: string): Promise<void> {
    const passwordResets = await this.passwordResetRepository.find({
      where: { isUsed: false },
    });

    for (const passwordReset of passwordResets) {
      const isMatch = await bcrypt.compare(resetCode, passwordReset.resetCode);
      if (isMatch) {
        await this.passwordResetRepository.update(
          { id: passwordReset.id },
          { isUsed: true },
        );
        break;
      }
    }
  }
}
