import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/users/user.entity';
import { Otp } from 'src/users/Entities/otp.entity';

@Injectable()
export class OtpService {
  constructor(
    @InjectRepository(Otp)
    private readonly otpRepository: Repository<Otp>,
  ) {}

  async generateOtp(user: User): Promise<string> {
    const code = Math.floor(100000 + Math.random() * 900000).toString(); // Generate a 6-digit OTP
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // Set expiration time (e.g., 10 minutes)

    const otp = this.otpRepository.create({
      code,
      expiresAt,
      user,
    });

    await this.otpRepository.save(otp);

    return code;
  }

  async verifyOtp(user: User, code: string): Promise<boolean> {
    const otp = await this.otpRepository.findOne({
      where: { user: { id: user.id }, code },
      relations: ['user'],
    });

    if (!otp) {
      return false;
    }

    if (otp.expiresAt < new Date()) {
      await this.otpRepository.delete({ id: otp.id });
      return false;
    }

    // Delete OTP after successful verification
    await this.otpRepository.delete({ id: otp.id });
    return true;
  }

  async findExistingOtp(user: User): Promise<Otp | null> {
    return await this.otpRepository.findOne({
      where: { user: { id: user.id } },
      order: { createdAt: 'DESC' },
    });
  }

  async deleteExpiredOtp(otpId: number): Promise<void> {
    await this.otpRepository.delete({ id: otpId });
  }
}
