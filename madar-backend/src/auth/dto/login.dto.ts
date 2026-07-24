import { IsEmail, IsString, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'ahmed@example.com', description: 'Email address' })
  @IsEmail()
  @Transform(({ value }) => typeof value === 'string' ? value.replace(/\uFEFF/g, '').trim().toLowerCase() : value)
  email: string;

  @ApiProperty({ example: 'SecurePass123!', description: 'Password' })
  @IsString()
  @MinLength(1)
  @Transform(({ value }) => typeof value === 'string' ? value.replace(/\uFEFF/g, '') : value)
  password: string;
}
