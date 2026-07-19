import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { Public } from '../../common/decorators/public.decorator';
import type { UserDocument } from '../users/schemas/user.schema';
import { setRefreshCookie } from './auth-cookie.util';

/** Google OAuth routes. Active only when the strategy is registered (credentials set). */
@Controller('auth/google')
export class GoogleController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Public()
  @UseGuards(AuthGuard('google'))
  @Get()
  start() {
    /* redirect handled by the guard */
  }

  @Public()
  @UseGuards(AuthGuard('google'))
  @Get('callback')
  async callback(@Req() req: Request, @Res() res: Response) {
    const result = await this.auth.issueForUser(req.user as UserDocument, req.headers['user-agent']);
    setRefreshCookie(res, result.refreshToken);
    // Hand the short-lived access token to the SPA, which stores it in memory.
    const origin = this.config.get<string>('CLIENT_ORIGIN');
    res.redirect(`${origin}/auth/callback#token=${result.accessToken}`);
  }
}
