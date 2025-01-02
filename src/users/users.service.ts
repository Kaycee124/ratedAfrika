import {
  Injectable,
  UnauthorizedException,
  Logger,
  HttpStatus,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, Sub_Plans, UserRole } from './user.entity';
import { RegisterUserDto } from 'src/auth/dto/register.dto';
import { UpdateUserDto } from 'src/auth/dto/update-user.dto';
import { UpgradePlanDto } from 'src/auth/dto/upgrade-plan.dto';
import { EmailService } from 'src/auth/services/email.service';
import { OtpService } from 'src/auth/services/otp.service';
import {
  UpdateNameDto,
  UpdateEmailDto,
  UpdatePhoneDto,
  UpdateProfileImageDto,
  UpdateCountryDto,
} from './dtos/update.dto';
import { TokenService } from 'src/auth/services/token.service';
// import { SpotifyUserDto } from 'src/auth/dto/spotify-user.dto';
// import { error, trace } from 'console';

export interface UpdateResponse<T = any> {
  statusCode: number;
  message: string;
  data?: T;
}

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private UserRepository: Repository<User>,
    private readonly otpService: OtpService,
    private readonly emailService: EmailService,
    private readonly tokenService: TokenService,
  ) {}

  // Helper method to verify OTP
  private async verifyOTP(user: User, otp: string): Promise<boolean> {
    const isValidOtp = await this.otpService.verifyOtp(user, otp);
    if (!isValidOtp) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }
    return true;
  }

  // Helper method to send OTP
  private async sendUpdateOTP(user: User, updateType: string): Promise<void> {
    const otp = await this.otpService.generateOtp(user);
    await this.emailService.sendUpdateOtpEmail(
      user.email,
      user.name,
      otp,
      `Verify ${updateType} Update`,
    );
  }
  // NameUpdate Service
  // Name Update Service
  async updateName(
    userId: string,
    updateNameDto: UpdateNameDto,
  ): Promise<UpdateResponse<User>> {
    try {
      const user = await this.UserRepository.findOne({ where: { id: userId } });
      if (!user) {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'User not found',
        };
      }

      user.name = updateNameDto.name;
      const updatedUser = await this.UserRepository.save(user);

      return {
        statusCode: HttpStatus.OK,
        message: 'Name updated successfully',
        data: updatedUser,
      };
    } catch (error) {
      this.logger.error(`Failed to update name: ${error.message}`);
      throw error;
    }
  }

  // Email update service - Requires OTP
  async initiateEmailUpdate(userId: string): Promise<UpdateResponse> {
    try {
      const user = await this.UserRepository.findOne({ where: { id: userId } });
      if (!user) {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'User not found',
        };
      }

      await this.sendUpdateOTP(user, 'Email');

      return {
        statusCode: HttpStatus.OK,
        message: 'OTP sent for email update verification',
      };
    } catch (error) {
      this.logger.error(`Failed to initiate email update: ${error.message}`);
      throw error;
    }
  }

  async updateEmail(
    userId: string,
    updateEmailDto: UpdateEmailDto,
    otp: string,
  ): Promise<UpdateResponse<User>> {
    try {
      const user = await this.UserRepository.findOne({ where: { id: userId } });
      if (!user) {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'User not found',
        };
      }

      // Check if email is already taken
      const existingUser = await this.UserRepository.findOne({
        where: { email: updateEmailDto.email },
      });
      if (existingUser && existingUser.id !== userId) {
        return {
          statusCode: HttpStatus.CONFLICT,
          message: 'Email already in use',
        };
      }

      await this.verifyOTP(user, otp);

      user.email = updateEmailDto.email;
      user.isEmailVerified = false; // Require verification of new email
      const updatedUser = await this.UserRepository.save(user);

      // Send verification email to new address
      const verificationToken =
        await this.tokenService.generateEmailVerificationToken(user);
      await this.emailService.sendEmailVerification(
        updateEmailDto.email,
        verificationToken,
        user.name,
      );

      return {
        statusCode: HttpStatus.OK,
        message:
          'Email updated successfully. Please verify your new email address.',
        data: updatedUser,
      };
    } catch (error) {
      this.logger.error(`Failed to update email: ${error.message}`);
      throw error;
    }
  }

  // Phone number update
  async updatePhone(
    userId: string,
    updatePhoneDto: UpdatePhoneDto,
  ): Promise<UpdateResponse<User>> {
    try {
      const user = await this.UserRepository.findOne({ where: { id: userId } });
      if (!user) {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'User not found',
        };
      }

      user.phoneNumber = updatePhoneDto.phoneNumber;
      const updatedUser = await this.UserRepository.save(user);

      return {
        statusCode: HttpStatus.OK,
        message: 'Phone number updated successfully',
        data: updatedUser,
      };
    } catch (error) {
      this.logger.error(`Failed to update phone number: ${error.message}`);
      throw error;
    }
  }

  // Profile Image Update
  async updateProfileImage(
    userId: string,
    updateProfileImageDto: UpdateProfileImageDto,
  ): Promise<UpdateResponse<User>> {
    try {
      const user = await this.UserRepository.findOne({ where: { id: userId } });
      if (!user) {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'User not found',
        };
      }

      user.profileImage = updateProfileImageDto.profileImage;
      const updatedUser = await this.UserRepository.save(user);

      return {
        statusCode: HttpStatus.OK,
        message: 'Profile image updated successfully',
        data: updatedUser,
      };
    } catch (error) {
      this.logger.error(`Failed to update profile image: ${error.message}`);
      throw error;
    }
  }

  // Country Update
  async updateCountry(
    userId: string,
    updateCountryDto: UpdateCountryDto,
  ): Promise<UpdateResponse<User>> {
    try {
      const user = await this.UserRepository.findOne({ where: { id: userId } });
      if (!user) {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'User not found',
        };
      }

      user.country = updateCountryDto.country;
      const updatedUser = await this.UserRepository.save(user);

      return {
        statusCode: HttpStatus.OK,
        message: 'Country updated successfully',
        data: updatedUser,
      };
    } catch (error) {
      this.logger.error(`Failed to update country: ${error.message}`);
      throw error;
    }
  }
  // END OFTHE REXT

  //create new user

  async createUser(
    email: string,
    password: string,
    name: string,
  ): Promise<User> {
    const user = this.UserRepository.create({
      name,
      password,
      email,
      role: [UserRole.NORMAL], // Default role is listener
      subscription: Sub_Plans.FREE, // Default subscription plan
      isEmailVerified: false,
      isActive: true,
    });

    return this.UserRepository.save(user);
  }

  //Find a user by email
  async findByEmail(email: string): Promise<User> {
    return this.UserRepository.findOne({ where: { email } });
  }

  // Find a user by ID
  async findById(id: string): Promise<User> {
    return this.UserRepository.findOneBy({ id });
  }

  // Find a user by reset token
  async findByResetToken(token: string): Promise<User> {
    return this.UserRepository.findOne({ where: { resetToken: token } });
  }

  // Save or update a user
  async save(user: User): Promise<User> {
    return this.UserRepository.save(user);
  }

  // create google user
  async createGoogleUser(registerUserDto: RegisterUserDto) {
    const { email, password, name, googleID } = registerUserDto;
    const user = this.UserRepository.create({
      name,
      password,
      email,
      role: [UserRole.NORMAL], // Default role is listener
      subscription: Sub_Plans.FREE, // Default subscription plan
      isEmailVerified: true,
      google_id: googleID,
      isActive: true,
    });
    return this.UserRepository.save(user);
  }
  async createSpotifyUser(spotifyUserData: {
    email: string;
    name: string;
    spotifyId: string;
    image?: string;
  }) {
    const user = this.UserRepository.create({
      email: spotifyUserData.email,
      name: spotifyUserData.name,
      role: [UserRole.NORMAL],
      subscription: Sub_Plans.FREE,
      isEmailVerified: true, // Spotify provides verified email
      spotify_id: spotifyUserData.spotifyId,
      profileImage: spotifyUserData.image,
      isActive: true,
    });

    return this.UserRepository.save(user);
  }

  async updateSpotifyUser(
    userId: string,
    spotifyData: {
      spotifyId: string;
      image?: string;
    },
  ) {
    await this.UserRepository.update(userId, {
      spotify_id: spotifyData.spotifyId,
      profileImage: spotifyData.image,
    });
    return this.UserRepository.findOne({ where: { id: userId } });
  }

  // In UsersService
  async remove(user: User): Promise<void> {
    await this.UserRepository.remove(user);
  }

  // Added to User Service
  // Get user profile details

  // // Get user profile details
  // async getUserProfile(userId: string): Promise<User | { message: string }> {
  //   const user = await this.UserRepository.findOne({ where: { id: userId } });

  //   if (!user) {
  //     this.logger.error('User not found', `User ID: ${userId}`);
  //     return { message: 'User not found' };
  //   }

  //   return user;
  // }
  async getUserProfile(userId: string): Promise<User | { message: string }> {
    const user = await this.UserRepository.findOne({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        subscription: true,
        isEmailVerified: true,
        isActive: true,
      },
    });

    if (!user) {
      this.logger.error('User not found', `User ID: ${userId}`);
      return { message: 'User not found' };
    }

    return user;
  }

  // Update user profile
  // async updateUserProfile(
  //   userId: string,
  //   updateUserDto: UpdateUserDto,
  // ): Promise<User | { message: string }> {
  //   const user = await this.UserRepository.findOne({ where: { id: userId } });

  //   if (!user) {
  //     this.logger.error(
  //       'User not found for profile update',
  //       `User ID: ${userId}`,
  //     );
  //     return { message: 'User not found' };
  //   }

  //   await this.UserRepository.update(userId, updateUserDto);
  //   this.logger.log(`User profile updated successfully for User ID: ${userId}`);

  //   // Return the updated user profile
  //   return this.getUserProfile(userId);
  // }

  async updateUserProfile(
    userId: string,
    updateUserDto: UpdateUserDto,
  ): Promise<User | { message: string }> {
    // Validate userId
    if (!userId) {
      this.logger.error('User ID is undefined or empty', '');
      return { message: 'Invalid user ID' };
    }

    // Check for empty update
    if (!updateUserDto || Object.keys(updateUserDto).length === 0) {
      this.logger.warn(`No update data provided for user ID: ${userId}`);
      return { message: 'No updates provided' };
    }

    const user = await this.UserRepository.findOne({ where: { id: userId } });

    if (!user) {
      this.logger.error(
        'User not found for profile update',
        `User ID: ${userId}`,
      );
      return { message: 'User not found' };
    }

    try {
      // Explicitly create update query
      await this.UserRepository.update(
        { id: userId }, // Ensure we're using the correct where clause
        updateUserDto,
      );

      this.logger.log(
        `User profile updated successfully for User ID: ${userId}`,
      );
      return this.getUserProfile(userId);
    } catch (error) {
      this.logger.error(
        `Failed to update user profile: ${error.message}`,
        `User ID: ${userId}`,
      );
      return { message: 'Failed to update profile' };
    }
  }

  // // Upgrade user plan
  // async upgradeUserPlan(
  //   userId: string,
  //   upgradePlanDto: UpgradePlanDto,
  // ): Promise<User | { message: string }> {
  //   const user = await this.UserRepository.findOne({ where: { id: userId } });

  //   if (!user) {
  //     this.logger.error(
  //       'User not found for plan upgrade',
  //       `User ID: ${userId}`,
  //     );
  //     return { message: 'User not found' };
  //   }

  //   const { newPlan } = upgradePlanDto;

  //   if (user.subscription === newPlan) {
  //     this.logger.warn(
  //       `User attempted to upgrade to an already active plan
  //       User ID: ${userId}, Current Plan: ${newPlan}`,
  //     );
  //     return { message: `You are already on the ${newPlan} plan.` };
  //   }

  //   user.subscription = newPlan;
  //   await this.UserRepository.save(user);
  //   this.logger.log(
  //     `User plan upgraded successfully
  //     User ID: ${userId}, New Plan: ${newPlan}`,
  //   );

  //   return user;
  // }

  async upgradeUserPlan(
    userId: string,
    upgradePlanDto: UpgradePlanDto,
  ): Promise<User | { message: string }> {
    const user = await this.UserRepository.findOne({
      where: { id: userId },
      select: {
        id: true,
        subscription: true,
      },
    });

    if (!user) {
      this.logger.error(
        'User not found for plan upgrade',
        `User ID: ${userId}`,
      );
      return { message: 'User not found' };
    }

    const { newPlan } = upgradePlanDto;

    if (user.subscription === newPlan) {
      this.logger.warn(
        `User attempted to upgrade to an already active plan
        User ID: ${userId}, Current Plan: ${newPlan}`,
      );
      return { message: `You are already on the ${newPlan} plan.` };
    }

    user.subscription = newPlan;
    await this.UserRepository.save(user);
    console.log(user);

    this.logger.log(
      `User plan upgraded successfully
      User ID: ${userId}, New Plan: ${newPlan}`,
    );

    // Fetch and return only the required fields
    const updatedUser = await this.UserRepository.findOne({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        name: true,
        subscription: true,
        role: true,
        isEmailVerified: true,
        isActive: true,
      },
    });

    return updatedUser;
  }

  // Get user plan status
  async getUserPlanStatus(
    userId: string,
  ): Promise<{ subscription: Sub_Plans } | { message: string }> {
    const user = await this.UserRepository.findOne({
      where: { id: userId },
      select: ['subscription'],
    });

    if (!user) {
      this.logger.error(
        'User not found for plan status check',
        `User ID: ${userId}`,
      );
      return { message: 'User not found' };
    }

    return { subscription: user.subscription };
  }
}
