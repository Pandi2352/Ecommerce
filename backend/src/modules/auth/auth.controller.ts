import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import {
  LoginDto,
  InviteUserDto,
  AcceptInviteDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  VerifyEmailDto,
  ChangePasswordDto,
  UpdateProfileDto,
} from './dto/auth.dto';
import { Public } from '../../common/decorators/public.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { CurrentUser, type AuthUser } from '../../common/decorators/current-user.decorator';
import { UsersService } from '../users/users.service';
import { RolesService } from '../roles/roles.service';
import { REFRESH_COOKIE, setRefreshCookie, clearRefreshCookie } from './auth-cookie.util';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly users: UsersService,
    private readonly roles: RolesService,
  ) {}

  /** Admin invites a new user (no public signup). */
  @RequirePermission('users.write')
  @Post('invite')
  async invite(@Body() dto: InviteUserDto) {
    await this.auth.inviteUser(dto);
    return { success: true };
  }

  /** Invited user sets their password → logged in. */
  @Public()
  @Post('accept-invite')
  async acceptInvite(
    @Body() dto: AcceptInviteDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.respond(res, await this.auth.acceptInvite(dto.token, dto.password, req.headers['user-agent']));
  }

  @Public()
  @Post('login')
  async login(@Body() dto: LoginDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    return this.respond(res, await this.auth.login(dto, req.headers['user-agent']));
  }

  @Public()
  @Post('refresh')
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    return this.respond(res, await this.auth.refresh(req.cookies?.[REFRESH_COOKIE], req.headers['user-agent']));
  }

  @Post('logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    await this.auth.logout(req.cookies?.[REFRESH_COOKIE]);
    clearRefreshCookie(res);
    return { success: true };
  }

  @Get('me')
  async me(@CurrentUser() current: AuthUser) {
    const user = await this.users.findById(current.id);
    if (!user) return null;
    const permissions = await this.roles.permissionsFor(user.role);
    return { ...(user.toJSON() as unknown as Record<string, unknown>), permissions };
  }

  // ── Password reset ──
  @Public()
  @Post('forgot-password')
  async forgot(@Body() dto: ForgotPasswordDto) {
    await this.auth.forgotPassword(dto.email);
    return { success: true }; // never reveal whether the email exists
  }

  @Public()
  @Post('reset-password')
  async reset(@Body() dto: ResetPasswordDto) {
    await this.auth.resetPassword(dto.token, dto.password);
    return { success: true };
  }

  // ── Email verification ──
  @Public()
  @Post('verify-email')
  async verify(@Body() dto: VerifyEmailDto) {
    await this.auth.verifyEmail(dto.token);
    return { success: true };
  }

  @Post('resend-verification')
  async resend(@CurrentUser() current: AuthUser) {
    const user = await this.users.findById(current.id);
    if (user) await this.auth.sendVerification(current.id, user.email);
    return { success: true };
  }

  // ── Profile + change password ──
  @Patch('profile')
  updateProfile(@CurrentUser() current: AuthUser, @Body() dto: UpdateProfileDto) {
    return this.users.updateProfile(current.id, dto);
  }

  @Post('change-password')
  async changePassword(@CurrentUser() current: AuthUser, @Body() dto: ChangePasswordDto) {
    await this.auth.changePassword(current.id, dto.currentPassword, dto.newPassword);
    return { success: true };
  }

  // ── Sessions ──
  @Get('sessions')
  sessions(@CurrentUser() current: AuthUser) {
    return this.auth.listSessions(current.id);
  }

  @Delete('sessions/:id')
  async revoke(@CurrentUser() current: AuthUser, @Param('id') id: string) {
    await this.auth.revokeSession(current.id, id);
    return { success: true };
  }

  @Delete('sessions')
  async revokeAll(@CurrentUser() current: AuthUser) {
    await this.auth.revokeAllSessions(current.id);
    return { success: true };
  }

  /** Set the refresh cookie; return access token + user (never leak the refresh token in the body). */
  private respond(res: Response, result: Awaited<ReturnType<AuthService['login']>>) {
    setRefreshCookie(res, result.refreshToken);
    return { accessToken: result.accessToken, user: result.user };
  }
}
