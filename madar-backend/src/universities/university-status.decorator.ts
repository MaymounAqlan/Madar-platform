import { SetMetadata } from '@nestjs/common';

export const SKIP_UNIVERSITY_STATUS_KEY = 'skipUniversityStatus';
export const SkipUniversityStatus = () => SetMetadata(SKIP_UNIVERSITY_STATUS_KEY, true);
