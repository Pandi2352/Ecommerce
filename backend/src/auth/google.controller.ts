import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { Public } from '../common/decorators/public.decorator';
import type { UserDocument } from '../users/schemas/user.schema';

const REFRESH_COOKIE = 'refresh_token';
const REFRESH_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

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
    res.cookie(REFRESH_COOKIE, result.refreshToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: REFRESH_MAX_AGE,
      path: '/',
    });
    // Hand the short-lived access token to the SPA, which stores it in memory.
    const origin = this.config.get<string>('CLIENT_ORIGIN');
    res.redirect(`${origin}/auth/callback#token=${result.accessToken}`);
  }
}
