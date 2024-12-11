import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
  Request,
  Post,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from 'src/auth/dto/update-user.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt/jwt.guard';
import { UpgradePlanDto } from 'src/auth/dto/upgrade-plan.dto';
import { HttpStatus } from '@nestjs/common';
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

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
