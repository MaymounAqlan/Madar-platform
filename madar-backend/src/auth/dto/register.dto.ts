import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
  IsEnum,
  IsObject,
  Matches,
  IsIn,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../../common/enums/user-role.enum';

function cleanString(value: any): any {
  return typeof value === 'string' ? value.replace(/\uFEFF/g, '').trim() : value;
}

class StudentProfileDto {
  @IsString()
  @MinLength(1)
  university: string;

  @IsString()
  @MinLength(1)
  college: string;

  @IsString()
  @MinLength(1)
  department: string;

  @IsString()
  @IsIn(['freshman', 'sophomore', 'junior', 'senior', 'graduate'])
  academicLevel: 'freshman' | 'sophomore' | 'junior' | 'senior' | 'graduate';

  @IsOptional()
  @IsObject()
  extras?: Record<string, any>;
}

export class RegisterDto {
  @ApiProperty({ example: 'Ahmed', description: 'First name (English)' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  @Transform(({ value }) => cleanString(value))
  firstName: string;

  @ApiProperty({ example: 'أحمد', description: 'First name (Arabic)' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  @Transform(({ value }) => cleanString(value))
  firstNameAr: string;

  @ApiProperty({ example: 'Al-Rashid', description: 'Last name (English)' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  @Transform(({ value }) => cleanString(value))
  lastName: string;

  @ApiProperty({ example: 'الراشد', description: 'Last name (Arabic)' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  @Transform(({ value }) => cleanString(value))
  lastNameAr: string;

  @ApiProperty({ example: 'ahmed@example.com', description: 'Email address' })
  @IsEmail()
  @Transform(({ value }) => typeof value === 'string' ? value.replace(/\uFEFF/g, '').trim().toLowerCase() : value)
  email: string;

  @ApiProperty({ example: '+966501234567', description: 'Phone number' })
  @IsOptional()
  @IsString()
  @Matches(/^\+?[0-9]{7,15}$/, { message: 'Invalid phone number format' })
  @Transform(({ value }) => cleanString(value))
  phone?: string;

  @ApiProperty({ example: 'SecurePass123!', description: 'Password (min 8 characters)' })
  @IsString()
  @MinLength(8)
  @MaxLength(100)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/, {
    message: 'Password must contain uppercase, lowercase, and a number',
  })
  @Transform(({ value }) => typeof value === 'string' ? value.replace(/\uFEFF/g, '') : value)
  password: string;

  @ApiProperty({ enum: UserRole, example: 'student', description: 'User role' })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiPropertyOptional({ example: { university: 'KSAU', major: 'CS' }, description: 'Role-specific profile data' })
  @IsOptional()
  @IsObject()
  profile?: Record<string, any> | StudentProfileDto;
}
