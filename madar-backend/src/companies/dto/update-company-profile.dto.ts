import { Transform } from 'class-transformer';
import {
  IsArray,
  IsEmail,
  IsEnum,
  IsObject,
  IsOptional,
  IsNumber,
  IsString,
  IsUrl,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

const emptyToUndefined = ({ value }: { value: unknown }) =>
  typeof value === 'string' && value.trim() === '' ? undefined : value;

export class UpdateCompanyProfileDto {
  @ApiPropertyOptional() @IsOptional() @IsString() name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() nameAr?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() industry?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() industryAr?: string;
  @ApiPropertyOptional({ enum: ['1-10', '1-50', '11-50', '51-200', '201-500', '201-1000', '501-1000', '1000+'] })
  @IsOptional() @IsEnum(['1-10', '1-50', '11-50', '51-200', '201-500', '201-1000', '501-1000', '1000+']) size?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() location?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() locationAr?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() formattedAddress?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() latitude?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() longitude?: number;

  @ApiPropertyOptional()
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsUrl({ require_protocol: true })
  website?: string;

  @ApiPropertyOptional()
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() phone?: string;

  @ApiPropertyOptional()
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsUrl({ require_protocol: true })
  logo?: string;

  @ApiPropertyOptional()
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsUrl({ require_protocol: true })
  logoUrl?: string;

  @ApiPropertyOptional()
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsUrl({ require_protocol: true })
  banner?: string;

  @ApiPropertyOptional()
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsUrl({ require_protocol: true })
  bannerUrl?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() descriptionAr?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() mission?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() vision?: string;
  @ApiPropertyOptional() @IsOptional() @IsArray() industryDomains?: string[];
  @ApiPropertyOptional() @IsOptional() @IsArray() technologies?: string[];
  @ApiPropertyOptional() @IsOptional() @IsArray() values?: string[];
  @ApiPropertyOptional() @IsOptional() @IsArray() benefits?: string[];
  @ApiPropertyOptional() @IsOptional() @IsObject() socialLinks?: Record<string, string>;
}
