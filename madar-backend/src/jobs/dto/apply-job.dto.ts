import { IsString, IsOptional, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ApplyJobDto {
  @ApiPropertyOptional() @IsOptional() @IsString() coverLetter?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  screeningAnswers?: Array<{ question: string; answer: string }>;
}
