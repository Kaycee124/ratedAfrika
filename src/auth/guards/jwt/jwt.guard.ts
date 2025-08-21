/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TokenService } from '../../services/token.service';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(
    private readonly tokenService: TokenService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    console.log('Step 1: JwtAuthGuard instantiated');
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    console.log('Step 2: Starting canActivate method');

    // Check parent canActivate
    console.log('Step 3: Checking parent AuthGuard canActivate');
    const parentCanActivate = await super.canActivate(context);
    if (!parentCanActivate) {
      console.log('Step 3a: Parent AuthGuard validation failed');
      return false;
    }
    console.log('Step 3b: Parent AuthGuard validation successful');

    // Extract request and token
    console.log('Step 4: Extracting request and token');
    const request = context.switchToHttp().getRequest();
    const token = this.extractJwtFromRequest(request);

    if (!token) {
      console.log('Step 4a: No token found in request');
      throw new UnauthorizedException('No bearer token provided');
    }
    console.log('Step 4b: Token successfully extracted from request');

    try {
      // Get JWT secret
      const secret = this.configService.get<string>('JWT_SECRET');
      if (!secret) {
        throw new Error('JWT_SECRET not configured');
      }

      // Verify token structure
      console.log('Step 5: Verifying JWT token structure');
      const payload = this.jwtService.verify(token, { secret });

      // Map the payload to include 'id' instead of using 'sub' directly
      request.user = {
        id: payload.sub,
        email: payload.email,
        name: payload.name,
        subscription: payload.subscription,
        tokenVersion: payload.tokenVersion,
        artistProfiles: payload.artistProfiles || [],
      };

      console.log('Step 5a: JWT token structure verified successfully', {
        userId: payload.sub,
        email: payload.email,
      });

      // Validate token in database/cache
      console.log('Step 6: Validating token in database/cache');
      const isValid = await this.tokenService.validateAccessToken(token);
      if (!isValid) {
        console.log('Step 6a: Token validation failed in database/cache');
        throw new UnauthorizedException('Token validation failed');
      }
      console.log('Step 6b: Token successfully validated in database/cache');

      console.log('Step 7: Authentication successful');
      return true;
    } catch (error) {
      console.log('Step 8: Error during token validation:', error.message);
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  private extractJwtFromRequest(request: any): string | null {
    console.log('Step 4.1: Extracting JWT from request headers');
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('Step 4.2: No valid authorization header found');
      return null;
    }

    console.log('Step 4.3: Bearer token found in headers');
    return authHeader.substring(7);
  }

  // Fixed handleRequest with correct type signature
  handleRequest<TUser = any>(
    err: any,
    user: any,
    info: any,
    context: ExecutionContext,
    status?: any,
  ): TUser {
    console.log('Step 9: Handling final request');
    if (err || !user) {
      console.log(
        'Step 9a: Error in handleRequest:',
        err?.message || 'No user found',
      );
      throw err || new UnauthorizedException('Authentication failed');
    }

    // Map the user object to include 'id'
    const mappedUser = {
      id: user.sub,
      email: user.email,
      name: user.name,
      subscription: user.subscription,
      tokenVersion: user.tokenVersion,
    };

    console.log('Step 9b: Request handled successfully');
    return mappedUser as TUser;
  }
}
