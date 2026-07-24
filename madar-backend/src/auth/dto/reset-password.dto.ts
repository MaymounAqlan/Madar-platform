import { IsString, MinLength, Matches } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({ description: 'Reset token received via email' })
  @IsString()
  @Transform(({ value }) => typeof value === 'string' ? value.replace(/\uFEFF/g, '').trim() : value)
  token: string;

  @ApiProperty({ example: 'NewPass123!', description: 'New password' })
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/, {
    message: 'Password must contain uppercase, lowercase, and a number',
  })
  @Transform(({ value }) => typeof value === 'string' ? value.replace(/\uFEFF/g, '') : value)
  newPassword: string;
}
