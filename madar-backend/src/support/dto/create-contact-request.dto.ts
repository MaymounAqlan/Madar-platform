import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  Length,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class CreateContactRequestDto {
  @Transform(trim)
  @IsString()
  @Length(2, 100)
  name: string;

  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail()
  @MaxLength(160)
  email: string;

  @IsIn(['visitor', 'student', 'university', 'company'])
  requesterType: 'visitor' | 'student' | 'university' | 'company';

  @Transform(trim)
  @IsString()
  @Length(3, 160)
  subject: string;

  @Transform(trim)
  @IsString()
  @Length(20, 3000)
  message: string;

  @IsOptional()
  @IsIn(['ar', 'en'])
  language?: 'ar' | 'en';

  // Honeypot field. Legitimate clients leave it empty.
  @IsOptional()
  @IsString()
  @MaxLength(200)
  website?: string;
}
