import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  SetMetadata,
  HttpStatus,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Sub_Plans } from '../../users/user.entity';

export const SUBSCRIPTION_KEY = 'requiredSubscriptions';

export const RequiredSubscriptions = (...plans: Sub_Plans[]) =>
  SetMetadata(SUBSCRIPTION_KEY, plans);

@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredSubscriptions = this.reflector.get<Sub_Plans[]>(
      SUBSCRIPTION_KEY,
      context.getHandler(),
    );

    if (!requiredSubscriptions) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Debug logging
    console.log('Subscription Guard - User:', {
      id: user?.sub,
      subscription: user?.subscription,
      requiredSubscriptions,
    });

    // Check if user exists and has subscription property
    if (!user?.subscription) {
      console.log('Subscription Guard - No subscription found for user');
      throw new ForbiddenException({
        statusCode: HttpStatus.FORBIDDEN,
        message: 'You need an active subscription to access this resource',
        error: 'SUBSCRIPTION_REQUIRED',
        data: {
          requiredPlans: requiredSubscriptions,
          currentPlan: user?.subscription || 'none',
        },
      });
    }

    // Check for label access to pro/independent features
    const hasLabelAccess =
      user.subscription === Sub_Plans.LABEL &&
      (requiredSubscriptions.includes(Sub_Plans.PRO) ||
        requiredSubscriptions.includes(Sub_Plans.INDEPENDENT));

    // Check for pro access to independent features
    const hasProAccess =
      user.subscription === Sub_Plans.PRO &&
      requiredSubscriptions.includes(Sub_Plans.INDEPENDENT);

    // Check if user's subscription is in required plans
    const hasRequiredPlan = requiredSubscriptions.includes(user.subscription);

    if (!hasRequiredPlan && !hasLabelAccess && !hasProAccess) {
      console.log('Subscription Guard - Invalid subscription plan');
      throw new ForbiddenException({
        statusCode: HttpStatus.FORBIDDEN,
        message:
          'Your current subscription plan does not allow access to this feature',
        error: 'INSUFFICIENT_SUBSCRIPTION',
        data: {
          requiredPlans: requiredSubscriptions,
          currentPlan: user.subscription,
        },
      });
    }

    console.log('Subscription Guard - Access granted');
    return true;
  }
}
