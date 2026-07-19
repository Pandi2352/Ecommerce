import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserStatus } from '@ecommerce/shared';
import type { AuthUser } from '../../../common/decorators/current-user.decorator';
import { UsersService } from '../../users/users.service';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  /** Token version — must match the user's current `tokenVersion` (kill-switch). */
  tv?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly users: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_ACCESS_SECRET'),
    });
  }

  /**
   * Return value becomes req.user. Re-checks the live user so bans, deletions,
   * role changes, and `tokenVersion` bumps take effect immediately (not after
   * the ~15-min access-token expiry).
   */
  async validate(payload: JwtPayload): Promise<AuthUser> {
    const user = await this.users.findById(payload.sub);
    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Session is no longer valid');
    }
    if ((user.tokenVersion ?? 0) !== (payload.tv ?? 0)) {
      throw new UnauthorizedException('Session expired — please sign in again');
    }
    return { id: String(user._id), name: user.name, email: user.email, role: user.role };
  }
}
