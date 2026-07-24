import {
  IsString,
  IsOptional,
  IsEnum,
  IsUrl,
  IsArray,
  IsObject,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCompanyDto {
  @ApiPropertyOptional() @IsOptional() @IsString() name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() nameAr?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() industry?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() industryAr?: string;
  @ApiPropertyOptional({ enum: ['1-10', '1-50', '11-50', '51-200', '201-500', '201-1000', '501-1000', '1000+'] })
  @IsOptional() @IsEnum(['1-10', '1-50', '11-50', '51-200', '201-500', '201-1000', '501-1000', '1000+']) size?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() location?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() locationAr?: string;
  @ApiPropertyOptional() @IsOptional() @IsUrl() website?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() email?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() phone?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() logo?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() logoUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() banner?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() bannerUrl?: string;
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
