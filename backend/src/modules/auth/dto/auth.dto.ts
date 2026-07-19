import { IsEmail, IsObject, IsOptional, IsString, Matches, MinLength } from 'class-validator';
import { PASSWORD_REGEX, PASSWORD_POLICY_MESSAGE } from '@ecommerce/shared';

export class InviteUserDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  role!: string;
}

export class AcceptInviteDto {
  @IsString()
  token!: string;

  @IsString()
  @Matches(PASSWORD_REGEX, { message: PASSWORD_POLICY_MESSAGE })
  password!: string;
}

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}

export class ForgotPasswordDto {
  @IsEmail()
  email!: string;
}

export class ResetPasswordDto {
  @IsString()
  token!: string;

  @IsString()
  @Matches(PASSWORD_REGEX, { message: PASSWORD_POLICY_MESSAGE })
  password!: string;
}

export class VerifyEmailDto {
  @IsString()
  token!: string;
}

export class ChangePasswordDto {
  @IsString()
  currentPassword!: string;

  @IsString()
  @Matches(PASSWORD_REGEX, { message: PASSWORD_POLICY_MESSAGE })
  newPassword!: string;
}

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  jobTitle?: string;

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsObject()
  links?: { website?: string; twitter?: string; linkedin?: string; github?: string };
}
