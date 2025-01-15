import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
  Request,
  Post,
  HttpCode,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from 'src/auth/dto/update-user.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt/jwt.guard';
import { UpgradePlanDto } from 'src/auth/dto/upgrade-plan.dto';
import { HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
// import {
//   UpdateNameDto,
//   UpdateEmailDto,
//   UpdatePhoneDto,
//   UpdateProfileImageDto,
//   UpdateCountryDto,
// } from './dtos/update.dto';
// import { InitiateUpdateDto } from './dtos/verify-update.dto';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // upgrade code
  // Field Update Endpoints
  // Email Update Endpoints - Requires OTP
  @Post('email/initiate-update')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Initiate email update process' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'OTP sent for email verification',
  })
  async initiateEmailUpdate(@Request() req) {
    const userId = req.user.id;
    return this.usersService.initiateEmailUpdate(userId);
  }

  @Patch('email/update')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update email with OTP verification' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Email updated successfully',
  })
  async updateEmail(
    @Request() req,
    @Body() updateDto: { email: string; otp: string },
  ) {
    const userId = req.user.id;
    const { email, otp } = updateDto;
    return this.usersService.updateEmail(userId, { email }, otp);
  }

  // Direct Update Endpoints - No OTP Required
  @Patch('name/update')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update user name' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Name updated successfully',
  })
  async updateName(@Request() req, @Body('name') name: string) {
    const userId = req.user.id;
    return this.usersService.updateName(userId, { name });
  }

  @Patch('phone/update')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update phone number' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Phone number updated successfully',
  })
  async updatePhone(@Request() req, @Body('phoneNumber') phoneNumber: string) {
    const userId = req.user.id;
    return this.usersService.updatePhone(userId, { phoneNumber });
  }

  @Patch('profile-image/update')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update profile image' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Profile image updated successfully',
  })
  async updateProfileImage(
    @Request() req,
    @Body('profileImage') profileImage: string,
  ) {
    const userId = req.user.id;
    return this.usersService.updateProfileImage(userId, { profileImage });
  }

  @Patch('country/update')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update country' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Country updated successfully',
  })
  async updateCountry(@Request() req, @Body('country') country: string) {
    const userId = req.user.id;
    return this.usersService.updateCountry(userId, { country });
  }

  // end of upgrade code

  // GET /user/profile
  @Get('profile')
  async getUserProfile(@Request() req) {
    const userId = req.user.id; // Retrieve user ID from JWT
    return this.usersService.getUserProfile(userId);
  }

  // PATCH /user/profile
  @Patch('profile')
  async updateUserProfile(
    @Request() req,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    // Add logging to debug
    console.log('User from request:', req.user);
    console.log('Update DTO:', updateUserDto);

    // Ensure we have a user ID
    if (!req.user || !req.user.id) {
      return {
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'User not authenticated',
        data: null,
      };
    }

    return this.usersService.updateUserProfile(req.user.id, updateUserDto);
  }

  // POST /user/upgrade-plan
  @Post('upgrade-plan')
  async upgradeUserPlan(
    @Request() req,
    @Body() upgradePlanDto: UpgradePlanDto,
  ) {
    const userId = req.user.id;
    return this.usersService.upgradeUserPlan(userId, upgradePlanDto);
  }

  // GET /user/plan-status
  @Get('plan-status')
  async getUserPlanStatus(@Request() req) {
    const userId = req.user.id;
    return this.usersService.getUserPlanStatus(userId);
  }
}
