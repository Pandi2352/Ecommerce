import { Body, Controller, Get, Post, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { Throttle } from '@nestjs/throttler';
import { AuthService, type AuthResult } from '../auth/auth.service';
import { UsersService } from '../users/users.service';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser, type AuthUser } from '../../common/decorators/current-user.decorator';
import {
  SF_REFRESH_COOKIE,
  setSfRefreshCookie,
  clearSfRefreshCookie,
} from './storefront-cookie.util';
import { CustomerLoginDto, RegisterCustomerDto } from './dto/customer.dto';

/** Public customer authentication for the storefront (self-registration allowed). */
@Controller('storefront/auth')
export class StorefrontAuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly users: UsersService,
  ) {}

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('register')
  async register(
    @Body() dto: RegisterCustomerDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.respond(res, await this.auth.registerCustomer(dto, req.headers['user-agent']));
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('login')
  async login(
    @Body() dto: CustomerLoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.respond(res, await this.auth.login(dto, req.headers['user-agent']));
  }

  @Public()
  @Post('refresh')
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    return this.respond(
      res,
      await this.auth.refresh(req.cookies?.[SF_REFRESH_COOKIE], req.headers['user-agent']),
    );
  }

  @Post('logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    await this.auth.logout(req.cookies?.[SF_REFRESH_COOKIE]);
    clearSfRefreshCookie(res);
    return { success: true };
  }

  /** Current customer (authenticated — any valid JWT). */
  @Get('me')
  async me(@CurrentUser() current: AuthUser) {
    const user = await this.users.findById(current.id);
    return user ? user.toJSON() : null;
  }

  private respond(res: Response, result: AuthResult) {
    setSfRefreshCookie(res, result.refreshToken);
    return { accessToken: result.accessToken, user: result.user };
  }
}
