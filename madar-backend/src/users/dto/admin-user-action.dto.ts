import { IsString, IsOptional, IsEmail, IsNotEmpty } from 'class-validator';

export class ResendVerificationDto {
  @IsOptional()
  @IsString()
  reason?: string;
}

export class SendResetPasswordDto {
  @IsOptional()
  @IsString()
  reason?: string;
}

export class UpdateUserStatusDto {
  @IsString()
  @IsNotEmpty()
  status: string;

  @IsOptional()
  @IsString()
  reason?: string;
}

export class SendTestEmailDto {
  @IsEmail()
  to: string;

  @IsOptional()
  @IsString()
  subject?: string;
}

export class UpdateSecurityAlertDto {
  @IsString()
  @IsNotEmpty()
  status: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
