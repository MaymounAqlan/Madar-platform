import { PartialType } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

const trim = ({ value }: { value: unknown }) => typeof value === 'string' ? value.trim() : value;

export class CreateDepartmentDto {
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
  head?: string;
}

export class UpdateDepartmentDto extends PartialType(CreateDepartmentDto) {}
