import { IsEmail, IsString, Length } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyEmailDto {
  @ApiProperty({ example: 'ahmed@example.com' })
  @IsEmail()
  @Transform(({ value }) => typeof value === 'string' ? value.replace(/\uFEFF/g, '').trim().toLowerCase() : value)
  email: string;

  @ApiProperty({ example: '123456', description: '6-digit verification code' })
  @IsString()
  @Length(6, 6)
  code: string;
}
