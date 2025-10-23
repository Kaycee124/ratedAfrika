import {
  Injectable,
  Logger,
  HttpStatus,
  HttpException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { RegisterUserDto } from './dto/register.dto';
import { LoginUserDto } from './dto/login.dto';
import { UsersService } from 'src/users/users.service';
import { User } from 'src/users/user.entity';
import { JwtService } from '@nestjs/jwt';
import { TokenService } from './services/token.service';
import { EmailService } from './services/email.service';
import { OtpService } from './services/otp.service';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import 'dotenv/config';

// Interface for consistent response structure
export interface ApiResponse<T = any> {
  // Changed code here - added interface
  statusCode: number;
  message: string;
  data?: T;
}

@Injectable()
export class AuthService {
  constructor(
    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly tokenService: TokenService,
    private readonly emailService: EmailService,
    private readonly otpService: OtpService,
  ) {}

  private readonly logger = new Logger(AuthService.name);

  // async generateJwt(
  //   user: User,
  // ): Promise<{ accessToken: string; refreshToken: string }> {
  //   const payload = { email: user.email, user_name: user.name, sub: user.id };
  //   const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
  //   const refreshToken = await this.tokenService.generateRefreshToken(user);
  //   return { accessToken, refreshToken };
  // }

  async generateJwt(
    user: User,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    // Use tokenService for both tokens
    const accessToken = await this.tokenService.generateAccessToken(user);
    const refreshToken = await this.tokenService.generateRefreshToken(user);

    return { accessToken, refreshToken };
  }

  async register(registerUserDto: RegisterUserDto): Promise<ApiResponse> {
    // Changed code here
    const { email, password, name } = registerUserDto;

    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) {
      throw new HttpException(
        'User with this email already exists',
        HttpStatus.CONFLICT,
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await this.usersService.createUser(
      email,
      hashedPassword,
      name,
    );

    const verificationToken =
      await this.tokenService.generateEmailVerificationToken(user);
    await this.emailService.sendEmailVerification(
      user.email,
      verificationToken,
      user.name,
    );

    return {
      statusCode: HttpStatus.CREATED,
      message:
        'Sign up successful. An email verification link has been sent to your email address.',
      data: { email: user.email },
    };
  }

  async login(loginUserDto: LoginUserDto): Promise<ApiResponse> {
    // Changed code here
    const { email, password } = loginUserDto;
    const user = await this.usersService.findByEmail(email);

    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new HttpException(
        'Invalid email or password',
        HttpStatus.UNAUTHORIZED,
      );
    }

    if (!user.isEmailVerified) {
      const verificationToken =
        await this.tokenService.generateEmailVerificationToken(user);
      await this.emailService.sendEmailVerification(
        user.email,
        verificationToken,
        user.name,
      );
      throw new HttpException(
        'Email not verified. A new verification link has been sent to your email.',
        HttpStatus.FORBIDDEN,
      );
    }

    const otp = await this.otpService.generateOtp(user);
    await this.emailService.sendOtpEmail(user.email, user.name, otp);

    return {
      statusCode: HttpStatus.OK,
      message:
        'An OTP has been sent to your email. Please verify to complete login.',
      data: {
        email: user.email,
        name: user.name,
        isEmailVerified: user.isEmailVerified,
        subscription: user.subscription,
        role: user.role,
      },
    };
  }

  async verifyOtp(
    verifyOtpDto: VerifyOtpDto,
  ): Promise<ApiResponse<{ accessToken: string; refreshToken: string }>> {
    // Changed code here
    const { email, otp } = verifyOtpDto;
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new HttpException('Invalid email or OTP', HttpStatus.UNAUTHORIZED);
    }

    const isValidOtp = await this.otpService.verifyOtp(user, otp);

    if (!isValidOtp) {
      throw new HttpException(
        'Invalid or expired OTP',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const tokens = await this.generateJwt(user);

    return {
      statusCode: HttpStatus.OK,
      message: 'Login successful',
      data: tokens,
    };
  }

  // 2024-12-28: Secure resend OTP functionality - only resends existing valid OTPs
  async resendOtp(email: string): Promise<ApiResponse> {
    // Input validation
    if (!email) {
      throw new HttpException('Email is required', HttpStatus.BAD_REQUEST);
    }

    // Find user (but don't reveal if they exist)
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      // Same message as expired OTP to prevent enumeration
      throw new HttpException(
        'No active OTP found. Please log in again to receive a new OTP.',
        HttpStatus.UNAUTHORIZED,
      );
    }

    // Check for existing OTP
    const existingOtp = await this.otpService.findExistingOtp(user);

    if (existingOtp) {
      if (existingOtp.expiresAt > new Date()) {
        // Valid OTP exists - resend it
        try {
          await this.emailService.sendOtpEmail(
            user.email,
            user.name,
            existingOtp.code,
          );

          this.logger.log(`OTP resent to user ${user.email}`);

          return {
            statusCode: HttpStatus.OK,
            message:
              'Your existing OTP has been resent. Please check your email.',
          };
        } catch (error) {
          this.logger.error(`Failed to resend OTP to ${user.email}:`, error);
          throw new HttpException(
            'Failed to send OTP. Please try again.',
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }
      } else {
        // Expired OTP - clean up and ask for relogin
        await this.otpService.deleteExpiredOtp(existingOtp.id);

        this.logger.log(`Expired OTP cleaned up for user ${user.email}`);

        throw new HttpException(
          'Your OTP has expired. Please log in again to receive a new OTP.',
          HttpStatus.UNAUTHORIZED,
        );
      }
    }

    // No OTP exists - user needs to login first
    throw new HttpException(
      'No active OTP found. Please log in again to receive a new OTP.',
      HttpStatus.UNAUTHORIZED,
    );
  }

  // async logout(userId: string, refreshToken: string): Promise<ApiResponse> {
  //   // Changed code here
  //   try {
  //     const payload =
  //       await this.tokenService.validateRefreshToken(refreshToken);

  //     if (!payload || payload.sub !== userId) {
  //       this.logger.warn(
  //         `Refresh token validation failed for userId ${userId}.`,
  //       );
  //       return {
  //         statusCode: HttpStatus.UNAUTHORIZED,
  //         message: 'Invalid refresh token.',
  //       };
  //     }

  //     await this.tokenService.invalidateTokens(userId);

  //     return {
  //       statusCode: HttpStatus.OK,
  //       message: 'Logout successful.',
  //     };
  //   } catch (error) {
  //     this.logger.error(
  //       `Error during logout for userId ${userId}: ${error.message}`,
  //       error.stack,
  //     );
  //     return {
  //       statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
  //       message: 'An error occurred during logout.',
  //     };
  //   }
  // }
  async logout(userId: string, refreshToken?: string): Promise<ApiResponse> {
    try {
      // Log the logout attempt
      this.logger.debug(`Attempting logout for user ${userId}`);

      // If refresh token is provided, validate it
      if (refreshToken) {
        const payload =
          await this.tokenService.validateRefreshToken(refreshToken);
        // Log but don't block logout if token is invalid
        if (!payload || payload.sub !== userId) {
          this.logger.warn(
            `Invalid refresh token provided during logout for userId ${userId}`,
          );
        }
      }

      // Always proceed with token invalidation
      await this.tokenService.invalidateTokens(userId);

      this.logger.debug(`Logout successful for user ${userId}`);
      return {
        statusCode: HttpStatus.OK,
        message: 'Logout successful.',
      };
    } catch (error) {
      this.logger.error(
        `Error during logout for userId ${userId}: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        'An error occurred during logout.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async refreshToken(
    refreshToken: string,
  ): Promise<ApiResponse<{ accessToken: string; refreshToken: string }>> {
    // Changed code here
    const payload = await this.tokenService.validateRefreshToken(refreshToken);
    if (!payload) {
      throw new HttpException(
        'Invalid or expired refresh token.',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      throw new HttpException('User not found.', HttpStatus.NOT_FOUND);
    }

    const tokens = await this.generateJwt(user);
    return {
      statusCode: HttpStatus.OK,
      message: 'Token refreshed successfully.',
      data: tokens,
    };
  }

  async requestPasswordReset(email: string): Promise<ApiResponse> {
    // Changed code here
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      return {
        statusCode: HttpStatus.OK, // Using OK to prevent email enumeration
        message:
          'If that email address is in our system, we have sent a password reset link.',
      };
    }
    const resetToken = await this.tokenService.generatePasswordResetCode(user);
    await this.emailService.sendPasswordResetEmail(
      user.email,
      resetToken,
      user.name,
    );

    return {
      statusCode: HttpStatus.OK,
      message:
        'If that email address is in our system, we have sent a password reset link.',
    };
  }

  async resetPassword(
    token: string,
    newPassword: string,
  ): Promise<ApiResponse> {
    // Changed code here
    const userId = await this.tokenService.validatePasswordResetCode(token);
    if (!userId) {
      throw new HttpException(
        'Invalid or expired password reset token.',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new HttpException('User not found.', HttpStatus.NOT_FOUND);
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await this.usersService.save(user);
    await this.tokenService.invalidateTokens(user.id);
    await this.tokenService.markPasswordResetCodeAsUsed(token);

    return {
      statusCode: HttpStatus.OK,
      message: 'Password has been reset successfully.',
    };
  }

  async verifyEmail(token: string): Promise<ApiResponse> {
    // Changed code here
    const userId =
      await this.tokenService.validateEmailVerificationToken(token);
    if (!userId) {
      throw new HttpException(
        'Invalid or expired email verification token.',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new HttpException('User not found.', HttpStatus.NOT_FOUND);
    }

    if (user.isEmailVerified) {
      return {
        statusCode: HttpStatus.OK,
        message: 'Email is already verified.',
      };
    }

    user.isEmailVerified = true;
    await this.usersService.save(user);
    await this.tokenService.markEmailVerificationTokenAsUsed(token);

    return {
      statusCode: HttpStatus.OK,
      message: 'Email has been verified successfully.',
    };
  }

  async changePassword(
    userId: string,
    changePasswordDto: { currentPassword: string; newPassword: string },
  ): Promise<ApiResponse> {
    // Changed code here
    const { currentPassword, newPassword } = changePasswordDto;
    const user = await this.usersService.findById(userId);

    if (!user) {
      throw new HttpException('User not found.', HttpStatus.NOT_FOUND);
    }

    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password,
    );
    if (!isPasswordValid) {
      throw new HttpException(
        'Invalid current password.',
        HttpStatus.UNAUTHORIZED,
      );
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await this.usersService.save(user);
    await this.tokenService.invalidateTokens(user.id);

    return {
      statusCode: HttpStatus.OK,
      message: 'Password has been changed successfully.',
    };
  }

  async deleteAccount(userId: string, password: string): Promise<ApiResponse> {
    // Changed code here
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new HttpException('User not found.', HttpStatus.NOT_FOUND);
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new HttpException('Invalid password.', HttpStatus.UNAUTHORIZED);
    }

    await this.usersService.remove(user);

    return {
      statusCode: HttpStatus.OK,
      message: 'Account has been deleted successfully.',
    };
  }

  // async validateToken(token: string): Promise<any> {
  //   return this.tokenService.validateAccessToken(token);
  // }

  // async validateUserByJwt(payload: any): Promise<User | null> {
  //   console.log(payload);
  //   const user = await this.usersService.findById(payload.sub);
  //   if (user) {
  //     return user;
  //   }
  //   return null;
  // }

  /**
   * Validates and processes a Google user's authentication.
   * If the user exists, returns the user. If not, creates a new user.
   * @param googleUser Data Transfer Object containing Google user details
   * @returns ApiResponse containing user data or error message
   */
  async validateGoogleUser(googleUser: RegisterUserDto): Promise<User> {
    try {
      const existingUser = await this.usersService.findByEmail(
        googleUser.email,
      );

      if (existingUser) {
        return existingUser; // Direct User return for auth
      }

      const newUser = await this.usersService.createGoogleUser(googleUser);
      return newUser; // Direct User return for auth
    } catch (error) {
      this.logger.error(`Failed to validate Google user: ${error.message}`);
      throw error; // Let the calling code handle the error
    }
  }

  async validateSpotifyUser(profile: any) {
    const existingUser = await this.usersService.findByEmail(
      profile.emails[0].value,
    );

    if (existingUser) {
      // Update existing user with Spotify data if not already linked
      if (!existingUser.spotify_id) {
        return this.usersService.updateSpotifyUser(existingUser.id, {
          spotifyId: profile.id,
          image: profile.photos?.[0]?.value,
        });
      }
      return existingUser;
    }

    // Create new user with Spotify data
    return this.usersService.createSpotifyUser({
      email: profile.emails[0].value,
      name: profile.displayName,
      spotifyId: profile.id,
      image: profile.photos?.[0]?.value,
    });
  }

  /**
   * Validates a user based on JWT payload.
   * @param payload The JWT payload containing user information
   * @returns ApiResponse containing user data or error message
   */
  async validateUserByJwt(payload: any): Promise<User | null> {
    try {
      const user = await this.usersService.findById(payload.sub);
      if (!user) {
        this.logger.warn(`User not found for payload sub: ${payload.sub}`);
        return null;
      }
      return user; // Direct User return for auth
    } catch (error) {
      this.logger.error(`Error validating user by JWT: ${error.message}`);
      return null;
    }
  }

  /**
   * Validates an access token.
   * @param token The access token to validate
   * @returns ApiResponse containing validation result
   */
  async validateToken(token: string): Promise<ApiResponse<any>> {
    try {
      const payload = await this.tokenService.validateAccessToken(token);

      if (!payload) {
        return {
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'Invalid token',
        };
      }

      return {
        statusCode: HttpStatus.OK,
        message: 'Token validated successfully',
        data: payload,
      };
    } catch (error) {
      this.logger.error(
        `Token validation failed: ${error.message}`,
        error.stack,
      );
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'An error occurred while validating token',
      };
    }
  }
}
