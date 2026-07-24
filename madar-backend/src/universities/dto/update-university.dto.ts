import { Transform } from 'class-transformer';
import { IsEmail, IsIn, IsOptional, IsString, IsUrl, Matches, MaxLength, ValidateIf } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

const trim = ({ value }: { value: unknown }) => typeof value === 'string' ? value.trim() : value;
const isPresent = (_object: unknown, value: unknown) => value !== undefined && value !== '';

export class UpdateUniversityDto {
  @ApiPropertyOptional()
  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @Transform(trim) @IsOptional() @IsString() @MaxLength(200)
  nameAr?: string;

  @IsOptional() @IsIn(['public', 'government', 'private', 'non_profit', 'research', 'international', 'other'])
  type?: string;

  @ApiPropertyOptional()
  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(3000)
  description?: string;

  @ApiPropertyOptional()
  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(160)
  city?: string;

  @ApiPropertyOptional()
  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(160)
  country?: string;

  @ApiPropertyOptional()
  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;

  @ApiPropertyOptional()
  @Transform(trim)
  @IsOptional()
  @ValidateIf(isPresent)
  @IsUrl({ require_protocol: true })
  website?: string;

  @ApiPropertyOptional()
  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string;

  @ApiPropertyOptional()
  @Transform(trim)
  @IsOptional()
  @ValidateIf(isPresent)
  @IsEmail()
  contactEmail?: string;

  @ApiPropertyOptional()
  @Transform(trim)
  @IsOptional()
  @ValidateIf(isPresent)
  @IsEmail()
  officialContactEmail?: string;

  @Transform(trim) @IsOptional() @IsString() @MaxLength(160)
  officialContactName?: string;

  @Transform(trim) @IsOptional() @IsString() @MaxLength(40)
  officialContactPhone?: string;

  @Transform(trim) @IsOptional() @IsString() @MaxLength(255)
  @Matches(/^(?!https?:\/\/)[a-z0-9.-]+\.[a-z]{2,}$/i, { message: 'Invalid university email domain' })
  emailDomain?: string;

  @ApiPropertyOptional()
  @Transform(trim)
  @IsOptional()
  @ValidateIf(isPresent)
  @IsUrl({ require_protocol: true })
  logoUrl?: string;
}
