import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'node:crypto';
import { UserStatus } from '@ecommerce/shared';
import { addDays, addMinutes, now } from '../../common/utils';
import { buildMeta } from '../../common/dto/pagination.dto';
import { UsersService } from '../users/users.service';
import { UserDocument } from '../users/schemas/user.schema';
import { MailService } from '../mail/mail.service';
import { RolesService } from '../roles/roles.service';
import { Session, SessionDocument } from './schemas/session.schema';
import { LoginDto } from './dto/auth.dto';
import type { JwtPayload } from './strategies/jwt.strategy';

export interface AuthResult {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    avatarUrl?: string;
    permissions: string[];
  };
}

interface MailToken {
  sub: string;
  purpose: 'reset' | 'verify' | 'invite';
}

/** Invites expire quickly — the link and the tracked window both use this. */
export const INVITE_TTL_MINUTES = 15;

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly mail: MailService,
    private readonly roles: RolesService,
    @InjectModel(Session.name) private readonly sessions: Model<SessionDocument>,
  ) {}

  async login(dto: LoginDto, userAgent?: string): Promise<AuthResult> {
    const user = await this.users.findByEmailWithPassword(dto.email);
    if (!user || !user.password) {
      throw new UnauthorizedException('Invalid email or password');
    }
    // Temporary lock after too many failed attempts.
    if (user.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
      throw new UnauthorizedException('Account temporarily locked after failed logins. Try again later.');
    }
    if (!(await bcrypt.compare(dto.password, user.password))) {
      await this.users.registerFailedLogin(String(user._id));
      throw new UnauthorizedException('Invalid email or password');
    }
    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException(`Account is ${user.status.toLowerCase()}`);
    }
    await this.users.clearFailedLogin(String(user._id));
    await this.users.touchLastLogin(String(user._id));
    return this.issue(user, userAgent);
  }

  // ── Invitations (admin-created accounts; no public signup) ─────────────────

  /** Admin invites a user: creates an INVITED account and emails a set-password link (15-min TTL). */
  async inviteUser(
    input: { email: string; name: string; role: string },
    invitedBy?: string,
  ): Promise<{ link: string }> {
    if (!(await this.roles.findByName(input.role))) {
      throw new BadRequestException(`Unknown role: ${input.role}`);
    }
    const invitedAt = now();
    const inviteExpiresAt = addMinutes(invitedAt, INVITE_TTL_MINUTES);
    const placeholder = await bcrypt.hash(randomBytes(24).toString('hex'), 10);
    const user = await this.users.create({
      email: input.email,
      name: input.name,
      password: placeholder,
      role: input.role,
      status: UserStatus.INVITED,
      invitedAt,
      inviteExpiresAt,
      invitedBy,
    });
    return { link: await this.sendInviteLink(String(user._id), user.email) };
  }

  /** Re-send an invite: refreshes the 15-min window + token and re-emails the link. */
  async reinviteUser(userId: string, invitedBy?: string): Promise<{ link: string }> {
    const user = await this.users.findById(userId);
    if (!user) throw new BadRequestException('User not found');
    if (user.status !== UserStatus.INVITED) {
      throw new BadRequestException('Only pending invites can be re-sent');
    }
    const invitedAt = now();
    await this.users.setInvite(userId, {
      invitedAt,
      inviteExpiresAt: addMinutes(invitedAt, INVITE_TTL_MINUTES),
      invitedBy,
    });
    return { link: await this.sendInviteLink(userId, user.email) };
  }

  /** Revoke a pending invite — removes the not-yet-activated account entirely. */
  async revokeInvite(userId: string): Promise<void> {
    const user = await this.users.findById(userId);
    if (!user) throw new BadRequestException('User not found');
    if (user.status !== UserStatus.INVITED) {
      throw new BadRequestException('Only pending invites can be revoked');
    }
    await this.users.hardDelete(userId);
  }

  private async sendInviteLink(userId: string, email: string): Promise<string> {
    const token = await this.mailToken(userId, 'invite', `${INVITE_TTL_MINUTES}m`);
    const link = `${this.config.get('CLIENT_ORIGIN')}/auth/accept?token=${token}`;
    await this.mail.sendInvite(email, link);
    return link;
  }

  /** Invited user sets their password → account becomes ACTIVE and they're logged in. */
  async acceptInvite(token: string, password: string, userAgent?: string): Promise<AuthResult> {
    const payload = await this.verifyMailToken(token, 'invite');
    const user = await this.users.findById(payload.sub);
    if (!user) throw new BadRequestException('Invitation is no longer valid');
    if (user.status !== UserStatus.INVITED) throw new BadRequestException('Invitation already used');
    await this.users.setPassword(payload.sub, await bcrypt.hash(password, 10));
    await this.users.adminUpdate(payload.sub, { status: UserStatus.ACTIVE });
    await this.users.setEmailVerified(payload.sub);
    const fresh = (await this.users.findById(payload.sub))!;
    return this.issue(fresh, userAgent);
  }

  async refresh(refreshToken: string, userAgent?: string): Promise<AuthResult> {
    const payload = await this.verifyRefresh(refreshToken);
    const active = await this.sessions.find({ user: payload.sub }).exec();
    const match = await this.firstMatchingSession(active, refreshToken);
    if (!match) throw new UnauthorizedException('Session expired');
    await match.deleteOne();

    const user = await this.users.findById(payload.sub);
    if (!user) throw new UnauthorizedException('User no longer exists');
    return this.issue(user, userAgent);
  }

  async logout(refreshToken?: string): Promise<void> {
    if (!refreshToken) return;
    try {
      const payload = await this.verifyRefresh(refreshToken);
      const active = await this.sessions.find({ user: payload.sub }).exec();
      const match = await this.firstMatchingSession(active, refreshToken);
      await match?.deleteOne();
    } catch {
      /* already invalid */
    }
  }

  // ── Password reset (mail token) ──────────────────────────────────────────

  /** Always resolves (don't reveal whether the email exists). Returns the link for dev logging. */
  async forgotPassword(email: string): Promise<void> {
    const user = await this.users.findByEmailWithPassword(email);
    if (!user) return;
    const token = await this.mailToken(String(user._id), 'reset', '30m');
    const link = `${this.config.get('CLIENT_ORIGIN')}/auth/reset?token=${token}`;
    // MailService is injected lazily via the controller to keep this file focused.
    await this.mail.sendPasswordReset(user.email, link);
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const payload = await this.verifyMailToken(token, 'reset');
    const hash = await bcrypt.hash(newPassword, 10);
    await this.users.setPassword(payload.sub, hash);
    // Kill every existing session + access token after a reset.
    await this.sessions.deleteMany({ user: payload.sub }).exec();
    await this.users.bumpTokenVersion(payload.sub);
  }

  // ── Email verification ───────────────────────────────────────────────────

  async sendVerification(userId: string, email: string): Promise<void> {
    const token = await this.mailToken(userId, 'verify', '1d');
    const link = `${this.config.get('CLIENT_ORIGIN')}/auth/verify?token=${token}`;
    await this.mail.sendVerification(email, link);
  }

  async verifyEmail(token: string): Promise<void> {
    const payload = await this.verifyMailToken(token, 'verify');
    await this.users.setEmailVerified(payload.sub);
  }

  // ── Change password (authenticated) ──────────────────────────────────────

  async changePassword(userId: string, current: string, next: string): Promise<void> {
    const user = await this.users.findByIdWithPassword(userId);
    if (!user || !user.password || !(await bcrypt.compare(current, user.password))) {
      throw new BadRequestException('Current password is incorrect');
    }
    await this.users.setPassword(userId, await bcrypt.hash(next, 10));
  }

  // ── Sessions ─────────────────────────────────────────────────────────────

  async listSessions(userId: string, page = 1, pageSize = 5) {
    const filter = { user: userId };
    const [rows, total] = await Promise.all([
      this.sessions
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .exec(),
      this.sessions.countDocuments(filter).exec(),
    ]);
    const data = rows.map((s) => ({
      id: String(s._id),
      userAgent: s.userAgent ?? 'Unknown device',
      createdAt: (s as unknown as { createdAt: Date }).createdAt,
      expiresAt: s.expiresAt,
    }));
    return { data, meta: buildMeta(total, page, pageSize) };
  }

  async revokeSession(userId: string, sessionId: string): Promise<void> {
    await this.sessions
      .deleteOne({ _id: sessionId, user: userId })
      .exec();
  }

  async revokeAllSessions(userId: string): Promise<void> {
    await this.sessions.deleteMany({ user: userId }).exec();
    // Also invalidate outstanding access tokens → true "sign out everywhere".
    await this.users.bumpTokenVersion(userId);
  }

  // ── OAuth issue (Google) ─────────────────────────────────────────────────

  async issueForUser(user: UserDocument, userAgent?: string): Promise<AuthResult> {
    return this.issue(user, userAgent);
  }

  // ── internals ────────────────────────────────────────────────────────────

  private async issue(user: UserDocument, userAgent?: string): Promise<AuthResult> {
    const payload: JwtPayload = {
      sub: String(user._id),
      email: user.email,
      role: user.role,
      tv: user.tokenVersion ?? 0,
    };
    const accessToken = await this.jwt.signAsync(payload, {
      secret: this.config.getOrThrow('JWT_ACCESS_SECRET'),
      expiresIn: this.config.get('JWT_ACCESS_TTL', '15m'),
    });
    const refreshToken = await this.jwt.signAsync(payload, {
      secret: this.config.getOrThrow('JWT_REFRESH_SECRET'),
      expiresIn: this.config.get('JWT_REFRESH_TTL', '7d'),
    });

    await this.sessions.create({
      user: user._id,
      tokenHash: await bcrypt.hash(refreshToken, 10),
      expiresAt: addDays(now(), 7),
      userAgent,
    });

    const permissions = await this.roles.permissionsFor(user.role);
    return {
      accessToken,
      refreshToken,
      user: {
        id: String(user._id),
        name: user.name,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl,
        permissions,
      },
    };
  }

  private verifyRefresh(token: string): Promise<JwtPayload> {
    return this.jwt
      .verifyAsync<JwtPayload>(token, { secret: this.config.getOrThrow('JWT_REFRESH_SECRET') })
      .catch(() => {
        throw new UnauthorizedException('Invalid refresh token');
      });
  }

  private mailToken(sub: string, purpose: MailToken['purpose'], expiresIn: string): Promise<string> {
    return this.jwt.signAsync(
      { sub, purpose },
      { secret: this.config.getOrThrow('JWT_MAIL_SECRET'), expiresIn: expiresIn as unknown as number },
    );
  }

  private async verifyMailToken(token: string, purpose: MailToken['purpose']): Promise<MailToken> {
    let payload: MailToken;
    try {
      payload = await this.jwt.verifyAsync<MailToken>(token, {
        secret: this.config.getOrThrow('JWT_MAIL_SECRET'),
      });
    } catch {
      throw new BadRequestException('Invalid or expired token');
    }
    if (payload.purpose !== purpose) throw new BadRequestException('Invalid token');
    return payload;
  }

  private async firstMatchingSession(
    sessions: SessionDocument[],
    token: string,
  ): Promise<SessionDocument | undefined> {
    for (const s of sessions) {
      if (await bcrypt.compare(token, s.tokenHash)) return s;
    }
    return undefined;
  }
}
