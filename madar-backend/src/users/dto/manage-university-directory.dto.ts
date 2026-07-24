import { PartialType } from '@nestjs/swagger';
import { ArrayMaxSize, IsArray, IsBoolean, IsEmail, IsEnum, IsInt, IsMongoId, IsOptional, IsString, IsUrl, Max, MaxLength, Min, MinLength } from 'class-validator';

export class CreateDirectoryUniversityDto {
  @IsString() @MinLength(2) @MaxLength(200) nameAr!: string;
  @IsOptional() @IsString() @MaxLength(200) nameEn?: string;
  @IsString() @MinLength(2) @MaxLength(160) slug!: string;
  @IsOptional() @IsArray() @ArrayMaxSize(30) @IsString({ each: true }) aliases?: string[];
  @IsEnum(['public_university', 'private_university', 'community_college', 'university_college', 'institute', 'academy']) institutionType!: string;
  @IsEnum(['public', 'private', 'mixed']) ownership!: string;
  @IsString() @MinLength(2) @MaxLength(100) governorate!: string;
  @IsOptional() @IsString() @MaxLength(100) city?: string;
  @IsOptional() @IsUrl({ require_protocol: true }) website?: string;
  @IsOptional() @IsEmail() officialEmail?: string;
  @IsOptional() @IsArray() @ArrayMaxSize(10) @IsString({ each: true }) phoneNumbers?: string[];
  @IsOptional() @IsArray() @ArrayMaxSize(20) @IsUrl({ require_protocol: true }, { each: true }) sourceUrls?: string[];
  @IsEnum(['verified', 'partially_verified', 'unverified']) verificationStatus!: string;
  @IsOptional() @IsEnum(['accredited', 'licensed', 'pending', 'unknown']) accreditationStatus?: string;
  @IsOptional() @IsInt() @Min(1800) @Max(2200) establishedYear?: number;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

export class UpdateDirectoryUniversityDto extends PartialType(CreateDirectoryUniversityDto) {}

export class CreateDirectoryCollegeDto {
  @IsString() @MinLength(2) @MaxLength(200) nameAr!: string;
  @IsOptional() @IsString() @MaxLength(200) nameEn?: string;
  @IsString() @MinLength(2) @MaxLength(160) slug!: string;
  @IsOptional() @IsString() @MaxLength(30) code?: string;
  @IsOptional() @IsEnum(['university_college', 'standalone_college', 'community_college']) institutionType?: string;
  @IsOptional() @IsArray() @ArrayMaxSize(20) @IsUrl({ require_protocol: true }, { each: true }) sourceUrls?: string[];
  @IsOptional() @IsEnum(['verified', 'partially_verified', 'unverified']) verificationStatus?: string;
}

export class CreateDirectoryDepartmentDto {
  @IsString() @MinLength(2) @MaxLength(200) nameAr!: string;
  @IsOptional() @IsString() @MaxLength(200) nameEn?: string;
  @IsString() @MinLength(2) @MaxLength(160) slug!: string;
  @IsOptional() @IsString() @MaxLength(30) code?: string;
  @IsOptional() @IsArray() @ArrayMaxSize(20) @IsUrl({ require_protocol: true }, { each: true }) sourceUrls?: string[];
  @IsOptional() @IsEnum(['verified', 'partially_verified', 'unverified']) verificationStatus?: string;
}

export class CreateDirectoryMajorDto extends CreateDirectoryDepartmentDto {
  @IsOptional() @IsString() @MaxLength(80) degreeType?: string;
}

export class ImportUniversityDirectoryDto {
  @IsArray() @ArrayMaxSize(500)
  records!: Record<string, unknown>[];
  @IsOptional() @IsBoolean() dryRun?: boolean;
  @IsOptional() @IsBoolean() downloadLogos?: boolean;
}

export class MergeUniversityDirectoryDto {
  @IsMongoId() targetUniversityId!: string;
}
