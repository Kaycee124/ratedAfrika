import { Injectable, Logger } from '@nestjs/common';
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

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly tokenService: TokenService,
    private readonly emailService: EmailService,
    private readonly otpService: OtpService, // Fixed line by checker01
  ) {}

  private readonly logger = new Logger(AuthService.name);

  /**
   * Generates JWT tokens (Access and Refresh) for a user.
   * @param user The user for whom to generate tokens.
   * @returns An object containing the access and refresh tokens.
   */
  async generateJwt(
    user: User,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = { email: user.email, user_name: user.name, sub: user.id };
    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' }); // Adjust expiration as needed
    const refreshToken = await this.tokenService.generateRefreshToken(user);
    return { accessToken, refreshToken };
  }

  /**
   * Registers a new user.
   * @param registerUserDto Data Transfer Object containing registration details.
   * @returns A success message.
   */
  async register(
    registerUserDto: RegisterUserDto,
  ): Promise<{ message: string }> {
    const { email, password, name } = registerUserDto;

    // Check if the user already exists
    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) {
      return { message: 'User with this email already exists' };
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create and save the new user
    const user = await this.usersService.createUser(
      email,
      hashedPassword,
      name,
    );

    // Generate email verification token and send verification email
    const verificationToken =
      await this.tokenService.generateEmailVerificationToken(user);
    await this.emailService.sendEmailVerification(
      user.email,
      verificationToken,
      user.name,
    );

    return {
      message:
        'Sign up successful. An email verification link has been sent to your email address.',
    };
  }

  /**
   * Logs in a user.
   * @param loginUserDto Data Transfer Object containing login credentials.
   * @returns A message indicating the result of the login attempt.
   */
  async login(loginUserDto: LoginUserDto): Promise<{ message: string }> {
    const { email, password } = loginUserDto;
    const user = await this.usersService.findByEmail(email);

    // Validate user existence and password
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return { message: 'Invalid email or password' };
    }

    // Check if email is verified
    if (!user.isEmailVerified) {
      const verificationToken =
        await this.tokenService.generateEmailVerificationToken(user);
      await this.emailService.sendEmailVerification(
        user.email,
        verificationToken,
        user.name,
      );
      return {
        message:
          'Email not verified. A new verification link has been sent to your email.',
      };
    }

    // Generate OTP
    const otp = await this.otpService.generateOtp(user); // Fixed line by checker01

    // Send OTP to user via email
    await this.emailService.sendOtpEmail(user.email, user.name, otp);

    return {
      message:
        'An OTP has been sent to your email. Please verify to complete login.',
    };
  }

  /**
   * Verifies the OTP and completes the login process by issuing tokens.
   * @param verifyOtpDto Data Transfer Object containing email and OTP.
   * @returns A success message along with access and refresh tokens.
   */
  async verifyOtp(
    verifyOtpDto: VerifyOtpDto,
  ): Promise<{ message: string; accessToken?: string; refreshToken?: string }> {
    const { email, otp } = verifyOtpDto;
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      return { message: 'Invalid email or OTP' };
    }

    const isValidOtp = await this.otpService.verifyOtp(user, otp); // Fixed line by checker01

    if (!isValidOtp) {
      return { message: 'Invalid or expired OTP' };
    }

    // Generate JWT tokens
    const { accessToken, refreshToken } = await this.generateJwt(user);

    return {
      message: 'Login successful',
      accessToken,
      refreshToken,
    };
  }

  /**
   * Validates and registers a Google user.
   * @param googleUser Data Transfer Object containing Google user details.
   * @returns The existing or newly created user.
   */
  async validateGoogleUser(googleUser: RegisterUserDto): Promise<User> {
    const user = await this.usersService.findByEmail(googleUser.email);
    if (user) {
      return user;
    }
    return await this.usersService.createGoogleUser(googleUser); // Fixed line by checker01
  }

  /**
   * Logs out a user by invalidating their refresh token.
   * @param userId The ID of the user logging out.
   * @param refreshToken The refresh token to invalidate.
   */
  async logout(
    userId: string,
    refreshToken: string,
  ): Promise<{ message: string }> {
    try {
      const payload =
        await this.tokenService.validateRefreshToken(refreshToken);

      if (!payload || payload.sub !== userId) {
        this.logger.warn(
          `Refresh token validation failed for userId ${userId}.`,
        );
        return { message: 'Invalid refresh token.' };
      }

      // Invalidate tokens
      await this.tokenService.invalidateTokens(userId);

      return { message: 'Logout successful.' };
    } catch (error) {
      this.logger.error(
        `Error during logout for userId ${userId}: ${error.message}`,
        error.stack,
      );
      return { message: 'An error occurred during logout.' };
    }
  }

  /**
   * Refreshes JWT tokens using a valid refresh token.
   * @param refreshToken The refresh token.
   * @returns New access and refresh tokens or an error message.
   */
  async refreshToken(
    refreshToken: string,
  ): Promise<{ message: string; accessToken?: string; refreshToken?: string }> {
    const payload = await this.tokenService.validateRefreshToken(refreshToken);
    if (!payload) {
      return { message: 'Invalid or expired refresh token.' };
    }

    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      return { message: 'User not found.' };
    }

    const tokens = await this.generateJwt(user);
    return {
      message: 'Token refreshed successfully.',
      ...tokens,
    };
  }

  /**
   * Sends a password reset email to the user.
   * @param email The user's email address.
   */
  async requestPasswordReset(email: string): Promise<{ message: string }> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      // To prevent email enumeration, respond with the same message
      return {
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
      message:
        'If that email address is in our system, we have sent a password reset link.',
    };
  }

  /**
   * Resets the user's password using a valid token.
   * @param token The password reset token.
   * @param newPassword The new password.
   */
  async resetPassword(
    token: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    const userId = await this.tokenService.validatePasswordResetCode(token);
    if (!userId) {
      return { message: 'Invalid or expired password reset token.' };
    }

    const user = await this.usersService.findById(userId);
    if (!user) {
      return { message: 'User not found.' };
    }

    // Hash the new password and update the user
    user.password = await bcrypt.hash(newPassword, 10);
    await this.usersService.save(user);

    // Invalidate all existing tokens
    await this.tokenService.invalidateTokens(user.id);

    // Optionally, mark the reset token as used
    await this.tokenService.markPasswordResetCodeAsUsed(token);

    return { message: 'Password has been reset successfully.' };
  }

  /**
   * Verifies the user's email using a verification token.
   * @param token The email verification token.
   */
  async verifyEmail(token: string): Promise<{ message: string }> {
    const userId =
      await this.tokenService.validateEmailVerificationToken(token);
    if (!userId) {
      return { message: 'Invalid or expired email verification token.' };
    }

    const user = await this.usersService.findById(userId);
    if (!user) {
      return { message: 'User not found.' };
    }

    if (user.isEmailVerified) {
      return { message: 'Email is already verified.' };
    }

    user.isEmailVerified = true;
    await this.usersService.save(user);

    // Optionally, mark the verification token as used
    await this.tokenService.markEmailVerificationTokenAsUsed(token);

    return { message: 'Email has been verified successfully.' };
  }

  /**
   * Changes the user's password.
   * @param userId The ID of the user.
   * @param changePasswordDto Data Transfer Object containing current and new passwords.
   */
  async changePassword(
    userId: string,
    changePasswordDto: { currentPassword: string; newPassword: string },
  ): Promise<{ message: string }> {
    const { currentPassword, newPassword } = changePasswordDto;
    const user = await this.usersService.findById(userId);

    if (!user) {
      return { message: 'User not found.' };
    }

    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password,
    );
    if (!isPasswordValid) {
      return { message: 'Invalid current password.' };
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await this.usersService.save(user);

    // Invalidate all existing tokens
    await this.tokenService.invalidateTokens(user.id);

    return { message: 'Password has been changed successfully.' };
  }

  /**
   * Deletes the user's account after verifying the password.
   * @param userId The ID of the user.
   * @param password The user's password for verification.
   */
  async deleteAccount(
    userId: string,
    password: string,
  ): Promise<{ message: string }> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      return { message: 'User not found.' };
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return { message: 'Invalid password.' };
    }

    // Remove user
    await this.usersService.remove(user); // Fixed line by checker01

    return { message: 'Account has been deleted successfully.' };
  }

  /**
   * Validates an access token.
   * @param token The access token.
   * @returns The token payload if valid, otherwise null.
   */
  async validateToken(token: string): Promise<any> {
    return this.tokenService.validateAccessToken(token);
  }

  /**
   * Validates a user by JWT payload.
   * @param payload The JWT payload.
   * @returns The user if validation is successful, otherwise null.
   */
  async validateUserByJwt(payload: any): Promise<User | null> {
    console.log(payload);
    const user = await this.usersService.findById(payload.sub);
    if (user) {
      return user;
    }
    return null;
  }
}
