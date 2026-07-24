import { IsEmail } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordDto {
  @ApiProperty({ example: 'ahmed@example.com' })
  @IsEmail()
  @Transform(({ value }) => typeof value === 'string' ? value.replace(/\uFEFF/g, '').trim().toLowerCase() : value)
  email: string;
}
