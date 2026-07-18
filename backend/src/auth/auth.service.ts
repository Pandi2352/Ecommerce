import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { UserRole } from '@ecommerce/shared';
import { UsersService } from '../users/users.service';
import { UserDocument } from '../users/schemas/user.schema';
import { MailService } from '../mail/mail.service';
import { Session, SessionDocument } from './schemas/session.schema';
import { SignupDto, LoginDto } from './dto/auth.dto';
import type { JwtPayload } from './strategies/jwt.strategy';

export interface AuthResult {
  accessToken: string;
  refreshToken: string;
  user: { id: string; name: string; email: string; role: string };
}

interface MailToken {
  sub: string;
  purpose: 'reset' | 'verify';
}

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly mail: MailService,
    @InjectModel(Session.name) private readonly sessions: Model<SessionDocument>,
  ) {}

  async signup(dto: SignupDto, userAgent?: string): Promise<AuthResult> {
    const password = await bcrypt.hash(dto.password, 10);
    const isFirstUser = (await this.users.count()) === 0;
    const user = await this.users.create({
      name: dto.name,
      email: dto.email,
      password,
      role: isFirstUser ? UserRole.ADMIN : undefined,
    });
    void this.sendVerification(String(user._id), user.email).catch(() => undefined);
    return this.issue(user, userAgent);
  }

  async login(dto: LoginDto, userAgent?: string): Promise<AuthResult> {
    const user = await this.users.findByEmailWithPassword(dto.email);
    if (!user || !user.password || !(await bcrypt.compare(dto.password, user.password))) {
      throw new UnauthorizedException('Invalid email or password');
    }
    await this.users.touchLastLogin(String(user._id));
    return this.issue(user, userAgent);
  }

  async refresh(refreshToken: string, userAgent?: string): Promise<AuthResult> {
    const payload = await this.verifyRefresh(refreshToken);
    const active = await this.sessions.find({ user: new Types.ObjectId(payload.sub) }).exec();
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
      const active = await this.sessions.find({ user: new Types.ObjectId(payload.sub) }).exec();
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
    await this.sessions.deleteMany({ user: new Types.ObjectId(payload.sub) }).exec();
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

  async listSessions(userId: string) {
    const rows = await this.sessions
      .find({ user: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .exec();
    return rows.map((s) => ({
      id: String(s._id),
      userAgent: s.userAgent ?? 'Unknown device',
      createdAt: (s as unknown as { createdAt: Date }).createdAt,
      expiresAt: s.expiresAt,
    }));
  }

  async revokeSession(userId: string, sessionId: string): Promise<void> {
    await this.sessions
      .deleteOne({ _id: new Types.ObjectId(sessionId), user: new Types.ObjectId(userId) })
      .exec();
  }

  async revokeAllSessions(userId: string): Promise<void> {
    await this.sessions.deleteMany({ user: new Types.ObjectId(userId) }).exec();
  }

  // ── OAuth issue (Google) ─────────────────────────────────────────────────

  async issueForUser(user: UserDocument, userAgent?: string): Promise<AuthResult> {
    return this.issue(user, userAgent);
  }

  // ── internals ────────────────────────────────────────────────────────────

  private async issue(user: UserDocument, userAgent?: string): Promise<AuthResult> {
    const payload: JwtPayload = { sub: String(user._id), email: user.email, role: user.role };
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
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      userAgent,
    });

    return {
      accessToken,
      refreshToken,
      user: { id: String(user._id), name: user.name, email: user.email, role: user.role },
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
