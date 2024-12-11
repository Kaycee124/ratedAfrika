import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, Sub_Plans, UserRole } from './user.entity';
import { RegisterUserDto } from 'src/auth/dto/register.dto';
import { customLoggerClass } from 'src/logger/logger.service';
import { UpdateUserDto } from 'src/auth/dto/update-user.dto';
import { UpgradePlanDto } from 'src/auth/dto/upgrade-plan.dto';
// import { SpotifyUserDto } from 'src/auth/dto/spotify-user.dto';
// import { error, trace } from 'console';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private UserRepository: Repository<User>,
    private readonly logger: customLoggerClass,
  ) {}

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
      image: spotifyUserData.image,
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
      image: spotifyData.image,
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
