// src/auth/strategies/jwt.strategy.ts
import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from './auth.service';
import { User } from 'src/users/user.entity'; // Adjust the import path as necessary
import 'dotenv/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(private readonly authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // Extracts JWT from the Authorization header
      ignoreExpiration: false, // Automatically rejects expired tokens
      secretOrKey: process.env.JWT_SECRET, // Secret key for verifying JWT
    });
  }

  async validate(payload: any): Promise<User> {
    this.logger.debug(`Validating JWT for user ID: ${payload.sub}`);
    const user = await this.authService.validateUserByJwt(payload);
    if (!user) {
      this.logger.warn(
        `User not found or token version mismatch for user ID: ${payload.sub}`,
      );
      throw new UnauthorizedException('Invalid token.');
    }
    return user; // This attaches the user to request.user
  }
}
