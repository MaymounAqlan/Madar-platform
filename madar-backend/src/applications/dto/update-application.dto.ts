import { IsString, IsOptional, IsNumber, IsDateString, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateApplicationDto {
  @ApiProperty({ enum: ['submitted', 'in-review', 'interview', 'accepted', 'rejected'] })
  @IsString()
  status: string;

  @ApiPropertyOptional() @IsOptional() @IsString() note?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() interviewDate?: string;
  @ApiPropertyOptional({ enum: ['video', 'in-person'] }) @IsOptional() @IsString() interviewType?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() interviewNotes?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() rejectionReason?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) offerSalary?: number;
}
