import { IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class AffiliationReasonDto {
  @IsString() @IsNotEmpty() @MaxLength(1000) reason: string;
}

export class ReviewAffiliationDto {
  @IsIn(['verified', 'rejected', 'suspended', 'graduated', 'pending']) status: string;
  @IsOptional() @IsString() @MaxLength(1000) reason?: string;
}
