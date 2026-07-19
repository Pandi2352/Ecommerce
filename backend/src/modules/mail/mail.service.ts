import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

/**
 * Sends transactional email. If SMTP_HOST is not configured, it logs the message
 * (and any action link) to the console — so dev flows work without a mail server.
 */
@Injectable()
export class MailService implements OnModuleInit {
  private readonly logger = new Logger(MailService.name);
  private transporter?: nodemailer.Transporter;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    const host = this.config.get<string>('SMTP_HOST');
    if (host) {
      this.transporter = nodemailer.createTransport({
        host,
        port: this.config.get<number>('SMTP_PORT', 587),
        auth: this.config.get('SMTP_USER')
          ? { user: this.config.get('SMTP_USER'), pass: this.config.get('SMTP_PASS') }
          : undefined,
      });
    }
  }

  async send(to: string, subject: string, html: string, link?: string): Promise<void> {
    if (!this.transporter) {
      this.logger.log(`[DEV MAIL] To: ${to} · ${subject}${link ? ` · Link: ${link}` : ''}`);
      return;
    }
    await this.transporter.sendMail({
      from: this.config.get<string>('MAIL_FROM'),
      to,
      subject,
      html,
    });
  }

  sendPasswordReset(to: string, link: string) {
    return this.send(
      to,
      'Reset your NovaShop password',
      `<p>Reset your password:</p><p><a href="${link}">${link}</a></p><p>This link expires in 30 minutes.</p>`,
      link,
    );
  }

  sendVerification(to: string, link: string) {
    return this.send(
      to,
      'Verify your NovaShop email',
      `<p>Confirm your email:</p><p><a href="${link}">${link}</a></p>`,
      link,
    );
  }

  sendInvite(to: string, link: string) {
    return this.send(
      to,
      "You've been invited to NovaShop admin",
      `<p>You've been invited. Set your password to activate your account:</p><p><a href="${link}">${link}</a></p><p>This link expires in 3 days.</p>`,
      link,
    );
  }
}
