import { IsString, IsOptional, IsEnum, IsNumber, IsArray, IsUrl } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSkillDto {
  @ApiProperty({ example: 'React' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'رياكت' })
  @IsString()
  nameAr: string;

  @ApiProperty({ enum: ['technical', 'soft', 'language', 'domain'] })
  @IsEnum(['technical', 'soft', 'language', 'domain'])
  category: string;

  @ApiPropertyOptional({ example: 'A JavaScript library for building user interfaces' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  marketDemand?: Array<{ jobTitle: string; frequency: number }>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  popularityScore?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  learningResources?: Array<{ name: string; url: string; provider: string }>;
}
