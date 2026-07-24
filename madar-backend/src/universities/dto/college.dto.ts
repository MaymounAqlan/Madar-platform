import { PartialType } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { Transform } from 'class-transformer';

const trim = ({ value }: { value: unknown }) => typeof value === 'string' ? value.trim() : value;

export class CreateCollegeDto {
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  name: string;

  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(160)
  nameAr?: string;

  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(30)
  code?: string;

  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(160)
  dean?: string;

  @IsOptional()
  @IsInt()
  @Min(1800)
  @Max(2100)
  established?: number;
}

export class UpdateCollegeDto extends PartialType(CreateCollegeDto) {}
