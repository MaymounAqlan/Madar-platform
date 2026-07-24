import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsArray,
  Min,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateJobDto {
  @ApiProperty() @IsString() title: string;
  @ApiPropertyOptional() @IsOptional() @IsString() titleAr?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() descriptionAr?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() location?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() locationAr?: string;
  @ApiProperty({ enum: ['remote', 'onsite', 'hybrid'] })
  @IsEnum(['remote', 'onsite', 'hybrid']) locationType: string;
  @ApiPropertyOptional({ enum: ['full-time', 'part-time', 'full_time', 'part_time', 'contract', 'internship', 'temporary', 'remote'] })
  @IsOptional() @IsEnum(['full-time', 'part-time', 'full_time', 'part_time', 'contract', 'internship', 'temporary', 'remote']) type?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() department?: string;
  @ApiPropertyOptional() @IsOptional() responsibilities?: string | string[];
  @ApiPropertyOptional() @IsOptional() requirements?: string | string[];
  @ApiPropertyOptional() @IsOptional() @IsString() experienceLevel?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() educationRequired?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() educationLevel?: string;
  @ApiPropertyOptional() @IsOptional() @IsArray() requiredSkills?: Array<{ name: string; weight: number }>;
  @ApiPropertyOptional() @IsOptional() @IsArray() skills?: string[];
  @ApiPropertyOptional() @IsOptional() @IsArray() niceToHaveSkills?: Array<{ name: string }>;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) salaryMin?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) salaryMax?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() salaryCurrency?: string;
  @ApiPropertyOptional() @IsOptional() @IsArray() benefits?: string[];
  @ApiPropertyOptional() @IsOptional() @IsString() city?: string;
  @ApiPropertyOptional() @IsOptional() hideSalary?: boolean;
  @ApiPropertyOptional() @IsOptional() equity?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsArray() screeningQuestions?: Array<string | { q?: string; question?: string; type?: string }>;
  @ApiPropertyOptional() @IsOptional() @IsDateString() deadline?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() expiresAt?: string;
}
