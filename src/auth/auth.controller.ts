import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Delete,
  Get,
  HttpStatus,
  Logger,
  HttpException,
  Res,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { PasswordResetDto } from './dto/password-reset.dto';
import { PasswordResetRequestDto } from './dto/password-reset-request.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { DeleteAccountDto } from './dto/delete-account.dto';
import { LogoutDto } from './dto/logout.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { User } from 'src/common/decorators/user.decorator';
import { User as UserEntity } from 'src/users/user.entity';
import { AuthService } from './auth.service';
import { RegisterUserDto } from './dto/register.dto';
import { LoginUserDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt/jwt.guard';
import { GoogleGuard } from './guards/google/google.guard';
import { SpotifyGuard } from './guards/spotify/spotify.guard';

// Define interfaces for consistent response types
interface TokenValidationResponse {
  valid: boolean;
  expiresAt?: string;
  userId?: string;
  message?: string;
}

// interface OAuthResponse {
//   oauth_status: string;
//   access_token: string;
//   refresh_token: string;
// }

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  private readonly logger = new Logger(AuthController.name);

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'User successfully registered',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Email already exists',
  })
  async register(@Body() registerUserDto: RegisterUserDto) {
    return await this.authService.register(registerUserDto);
  }

  @Post('login')
  @ApiOperation({ summary: 'User login' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Login successful' })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid credentials',
  })
  async login(@Body() loginUserDto: LoginUserDto) {
    return await this.authService.login(loginUserDto);
  }

  @Post('verify-otp')
  @ApiOperation({ summary: 'Verify OTP for login' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'OTP verified successfully',
  })
  async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
    return await this.authService.verifyOtp(verifyOtpDto);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'User logout' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Logout successful' })
  async logout(@Body() logoutDto: LogoutDto, @User() user: UserEntity) {
    return await this.authService.logout(user.id, logoutDto.refreshToken);
  }

  @Post('refresh-token')
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Token refreshed successfully',
  })
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    return await this.authService.refreshToken(refreshTokenDto.refreshToken);
  }

  @Post('password-reset-request')
  @ApiOperation({ summary: 'Request password reset' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Reset email sent if email exists',
  })
  async requestPasswordReset(
    @Body() passwordResetRequestDto: PasswordResetRequestDto,
  ) {
    return await this.authService.requestPasswordReset(
      passwordResetRequestDto.email,
    );
  }

  @Post('password-reset')
  @ApiOperation({ summary: 'Reset password using token' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Password reset successful',
  })
  async resetPassword(@Body() passwordResetDto: PasswordResetDto) {
    return await this.authService.resetPassword(
      passwordResetDto.token,
      passwordResetDto.newPassword,
    );
  }

  @Post('verify-email')
  @ApiOperation({ summary: 'Verify email address' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Email verified successfully',
  })
  async verifyEmail(@Body() verifyEmailDto: VerifyEmailDto) {
    const { token } = verifyEmailDto;

    if (!token) {
      throw new HttpException(
        'Verification code is missing',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      return await this.authService.verifyEmail(token);
    } catch (error) {
      this.logger.error('Email verification failed', error);
      throw new HttpException(
        'Email verification failed',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change password' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Password changed successfully',
  })
  async changePassword(
    @Body() changePasswordDto: ChangePasswordDto,
    @Req() req,
  ) {
    return await this.authService.changePassword(
      req.user.id,
      changePasswordDto,
    );
  }

  @Post('validate-token')
  @ApiOperation({ summary: 'Validate refresh token' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Token validation result',
  })
  async validateToken(
    @Body() refreshTokenDto: RefreshTokenDto,
  ): Promise<TokenValidationResponse> {
    try {
      const response = await this.authService.validateToken(
        refreshTokenDto.refreshToken,
      );

      if (response.statusCode === HttpStatus.OK && response.data) {
        return {
          valid: true,
          expiresAt: new Date(response.data.exp * 1000).toISOString(),
          userId: response.data.sub,
        };
      }

      return {
        valid: false,
        message: response.message || 'Token is invalid or expired.',
      };
    } catch (error) {
      this.logger.error('Token validation failed', error);
      return {
        valid: false,
        message: 'Token validation failed.',
      };
    }
  }

  @Delete('delete-account')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete user account' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Account deleted successfully',
  })
  async deleteAccount(@Body() deleteAccountDto: DeleteAccountDto, @Req() req) {
    return await this.authService.deleteAccount(
      req.user.id,
      deleteAccountDto.password,
    );
  }

  @Get('google/login')
  @UseGuards(GoogleGuard)
  @ApiOperation({ summary: 'Initiate Google OAuth login' })
  async googleLogin() {
    // Initiates the Google OAuth2 login flow
    // The guard handles the redirect
  }

  // @Get('google/callback')
  // @UseGuards(GoogleGuard)
  // @ApiOperation({ summary: 'Handle Google OAuth callback' })
  // @ApiResponse({
  //   status: HttpStatus.OK,
  //   description: 'Google OAuth successful',
  // })
  // async googleCallback(@Req() req): Promise<OAuthResponse> {
  //   try {
  //     const response = await this.authService.generateJwt(req.user);
  //     return {
  //       oauth_status: 'successful',
  //       access_token: response.accessToken,
  //       refresh_token: response.refreshToken,
  //     };
  //   } catch (error) {
  //     this.logger.error('Google OAuth callback failed', error);
  //     throw new HttpException('Authentication failed', HttpStatus.UNAUTHORIZED);
  //   }
  // }

  @UseGuards(GoogleGuard)
  @Get('google/callback')
  async googleCallback(@Req() req, @Res() res) {
    try {
      const user = await this.authService.validateGoogleUser(req.user);
      const { accessToken, refreshToken } =
        await this.authService.generateJwt(user);

      // Build redirect URL with tokens
      const frontendUrl = new URL(process.env.FRONTEND_URL + '/overview');
      const tokenPayload = Buffer.from(
        JSON.stringify({ accessToken, refreshToken }),
      ).toString('base64');

      frontendUrl.searchParams.append('auth', tokenPayload);

      return res.redirect(frontendUrl.toString());
    } catch (error) {
      this.logger.error('OAuth callback failed:', error);
      return res.redirect(`${process.env.FRONTEND_URL}/auth/error`);
    }
  }

  @Get('spotify/login')
  @UseGuards(SpotifyGuard)
  @ApiOperation({ summary: 'Initiate Spotify OAuth login' })
  async spotifyLogin() {
    // Initiates the Spotify OAuth2 login flow
    // The guard handles the redirect
  }

  @Get('spotify/callback')
  @UseGuards(SpotifyGuard)
  @ApiOperation({ summary: 'Handle Spotify OAuth callback' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Spotify OAuth callback received',
  })
  async spotifyCallback(@Req() req, @Res() res) {
    try {
      this.logger.debug('Spotify OAuth Callback Data:', req.user);

      // Extract the profile data from req.user
      const spotifyProfile = {
        id: req.user.user.spotify_id,
        emails: [{ value: req.user.user.email }],
        displayName: req.user.user.name,
        photos: req.user.user.profileImage
          ? [{ value: req.user.user.profileImage }]
          : [],
      };

      // Validate user using your existing validateSpotifyUser method
      const validatedUser =
        await this.authService.validateSpotifyUser(spotifyProfile);

      // Generate JWT tokens
      const { accessToken, refreshToken } =
        await this.authService.generateJwt(validatedUser);

      // Build redirect URL with tokens
      const frontendUrl = new URL(process.env.FRONTEND_URL + '/overview');
      const tokenPayload = Buffer.from(
        JSON.stringify({
          accessToken,
          refreshToken,
        }),
      ).toString('base64');

      frontendUrl.searchParams.append('auth', tokenPayload);

      // Redirect to frontend
      return res.redirect(frontendUrl.toString());
    } catch (error) {
      this.logger.error('Spotify OAuth callback failed:', error);
      return res.redirect(`${process.env.FRONTEND_URL}/auth/error`);
    }
  }
}
