// src/users/dto/upgrade-plan.dto.ts

import { IsEnum } from 'class-validator';
import { Sub_Plans } from 'src/users/user.entity';

export class UpgradePlanDto {
  @IsEnum(Sub_Plans, { message: 'Invalid subscription plan' })
  newPlan: Sub_Plans;
}
