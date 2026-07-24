import { IsNumber, IsOptional, IsString, Min, Max } from 'class-validator';

export class UpdateModelSettingsDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  matchThreshold?: number;

  @IsOptional()
  @IsString()
  embeddingModel?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  confidenceThreshold?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10000)
  batchSize?: number;

  @IsOptional()
  @IsNumber()
  @Min(100)
  @Max(60000)
  timeoutMs?: number;
}
