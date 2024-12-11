// // src/common/guards/subscription.guard.ts
// import {
//   Injectable,
//   CanActivate,
//   ExecutionContext,
//   ForbiddenException,
//   SetMetadata, // Added this import to fix the error
//   HttpStatus,
// } from '@nestjs/common';
// import { Reflector } from '@nestjs/core';
// import { Sub_Plans } from '../../users/user.entity';

// // Define a key for our metadata
// export const SUBSCRIPTION_KEY = 'requiredSubscriptions';

// // Custom decorator to specify required subscription plans
// export const RequiredSubscriptions = (...plans: Sub_Plans[]) =>
//   SetMetadata(SUBSCRIPTION_KEY, plans);

// @Injectable()
// export class SubscriptionGuard implements CanActivate {
//   constructor(private reflector: Reflector) {}

//   async canActivate(context: ExecutionContext): Promise<boolean> {
//     // Get the required subscriptions from the endpoint decorator
//     const requiredSubscriptions = this.reflector.get<Sub_Plans[]>(
//       SUBSCRIPTION_KEY, // Using our constant instead of a string literal
//       context.getHandler(),
//     );

//     // If no subscription requirements are set, allow access
//     if (!requiredSubscriptions) {
//       return true;
//     }

//     const request = context.switchToHttp().getRequest();
//     const user = request.user;

//     // Ensure user exists and has a subscription
//     if (!user || !user.subscription) {
//       throw new ForbiddenException({
//         statusCode: HttpStatus.FORBIDDEN,
//         message: 'You need an active subscription to access this resource',
//         data: {
//           requiredSubscriptions,
//           currentSubscription: user?.subscription || 'none',
//         },
//       });
//     }

//     // Check if user's subscription is in the required plans
//     const hasRequiredSubscription = requiredSubscriptions.includes(
//       user.subscription,
//     );

//     // Special handling for LABEL subscription (can access both LABEL and ARTIST features)
//     const isLabelAccessingArtistFeature =
//       user.subscription === Sub_Plans.LABEL &&
//       requiredSubscriptions.includes(Sub_Plans.ARTIST);

//     if (!hasRequiredSubscription && !isLabelAccessingArtistFeature) {
//       throw new ForbiddenException({
//         statusCode: HttpStatus.FORBIDDEN,
//         message:
//           'Your current subscription plan does not allow access to this feature',
//         data: {
//           requiredSubscriptions,
//           currentSubscription: user.subscription,
//         },
//       });
//     }

//     return true;
//   }
// }

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

    // Check for label access to artist features
    const hasLabelAccess =
      user.subscription === Sub_Plans.LABEL &&
      requiredSubscriptions.includes(Sub_Plans.ARTIST);

    // Check if user's subscription is in required plans
    const hasRequiredPlan = requiredSubscriptions.includes(user.subscription);

    if (!hasRequiredPlan && !hasLabelAccess) {
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
