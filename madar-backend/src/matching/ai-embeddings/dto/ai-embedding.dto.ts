import { ArrayMaxSize, ArrayMinSize, IsArray, IsIn, IsInt, IsMongoId, IsNumber, IsObject, IsOptional, IsString, Max, Min } from 'class-validator';

export class UpsertAiEmbeddingDto {
  @IsIn(['student', 'job', 'skill', 'course'])
  entityType: string;

  @IsMongoId()
  entityId: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(4096)
  @IsNumber({}, { each: true })
  vector: number[];

  @IsString()
  model: string;

  @IsString()
  modelVersion: string;

  @IsString()
  textHash: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

export class SearchAiEmbeddingDto {
  @IsIn(['student', 'job', 'skill', 'course'])
  entityType: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(4096)
  @IsNumber({}, { each: true })
  vector: number[];

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @IsString()
  modelVersion?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
