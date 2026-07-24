import {
  IsEmail,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../../common/enums/user-role.enum';

class StudentProfileDto {
  @ApiProperty({ description: 'University MongoDB ObjectId' })
  @IsString()
  @MinLength(1)
  universityId: string;

  @ApiProperty({ description: 'College MongoDB ObjectId' })
  @IsString()
  @MinLength(1)
  collegeId: string;

  @ApiProperty({ description: 'Department MongoDB ObjectId' })
  @IsString()
  @MinLength(1)
  departmentId: string;

  @ApiPropertyOptional({ description: 'Academic program MongoDB ObjectId' })
  @IsOptional()
  @IsString()
  majorId?: string;

  @ApiPropertyOptional({ description: 'Student academic level' })
  @IsOptional()
  @IsString()
  academicLevel?: string;

  @ApiPropertyOptional({ description: 'Student number' })
  @IsOptional()
  @IsString()
  studentNumber?: string;

  @ApiPropertyOptional({ description: 'Enrollment year' })
  @IsOptional()
  @IsString()
  enrollmentYear?: string;

  @ApiPropertyOptional({ description: 'Expected graduation year' })
  @IsOptional()
  @IsString()
  expectedGraduationYear?: string;
}

class CompanyProfileDto {
  @ApiProperty({ description: 'Company name' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  companyName: string;

  @ApiProperty({ description: 'Industry' })
  @IsString()
  @MinLength(1)
  industry: string;

  @ApiPropertyOptional({ description: 'Company description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Location' })
  @IsOptional()
  @IsString()
  location?: string;
}

class UniversityProfileDto {
  @ApiProperty({ description: 'University name' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  universityName: string;

  @ApiPropertyOptional({ description: 'Location' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ description: 'Official contact email' })
  @IsOptional()
  @IsEmail()
  officialContact?: string;

  @ApiPropertyOptional({ description: 'Description' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class CompleteGoogleRegistrationDto {
  @ApiPropertyOptional({ description: 'Google account id' })
  @IsOptional()
  @IsString()
  googleId?: string;

  @ApiPropertyOptional({ description: 'LinkedIn account id' })
  @IsOptional()
  @IsString()
  linkedinId?: string;

  @ApiProperty({ description: 'OAuth account email' })
  @Transform(({ value }) => typeof value === 'string' ? value.replace(/\uFEFF/g, '').trim().toLowerCase() : value)
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'First name from Google profile' })
  @Transform(({ value }) => typeof value === 'string' ? value.replace(/\uFEFF/g, '').trim() : value)
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  firstName: string;

  @ApiProperty({ description: 'Last name from Google profile' })
  @Transform(({ value }) => typeof value === 'string' ? value.replace(/\uFEFF/g, '').trim() : value)
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  lastName: string;

  @ApiPropertyOptional({ description: 'Google profile image URL' })
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiProperty({ description: 'Phone number' })
  @IsString()
  @MinLength(1)
  @MaxLength(30)
  phone: string;

  @ApiProperty({ enum: [UserRole.STUDENT, UserRole.COMPANY, UserRole.UNIVERSITY], description: 'Role for Google registration' })
  @IsEnum([UserRole.STUDENT, UserRole.COMPANY, UserRole.UNIVERSITY])
  role: UserRole;

  @ApiPropertyOptional({ description: 'Role-specific profile payload' })
  @IsOptional()
  @IsObject()
  profile?: Record<string, any>;
}
