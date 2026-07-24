import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateCollegeDto } from './college.dto';
import { CreateDepartmentDto } from './department.dto';
import { UpdateUniversityDto } from './update-university.dto';
import { ReviewUniversityDto } from '../../users/dto/review-university.dto';

describe('University management DTO validation', () => {
  it('rejects blank college and department names', async () => {
    const collegeErrors = await validate(plainToInstance(CreateCollegeDto, { name: '   ' }));
    const departmentErrors = await validate(plainToInstance(CreateDepartmentDto, { name: '' }));
    expect(collegeErrors).toHaveLength(1);
    expect(departmentErrors).toHaveLength(1);
  });

  it('trims supported fields and rejects unknown fields through the global whitelist contract', async () => {
    const college = plainToInstance(CreateCollegeDto, { name: '  Engineering  ', code: '  ENG  ' });
    expect(await validate(college)).toHaveLength(0);
    expect(college.name).toBe('Engineering');
    expect(college.code).toBe('ENG');
    expect(college).not.toHaveProperty('universityId');
  });

  it('validates and trims university profile contact fields', async () => {
    const valid = plainToInstance(UpdateUniversityDto, { name: '  Test University  ', contactEmail: 'contact@example.edu' });
    const invalid = plainToInstance(UpdateUniversityDto, { officialContactEmail: 'not-an-email' });
    expect(await validate(valid)).toHaveLength(0);
    expect(valid.name).toBe('Test University');
    expect(await validate(invalid)).toHaveLength(1);
  });

  it('rejects invalid university website URLs', async () => {
    const invalid = plainToInstance(UpdateUniversityDto, { website: 'not-a-url' });
    expect(await validate(invalid)).toHaveLength(1);
  });

  it('requires a non-blank rejection or suspension reason', async () => {
    const invalid = plainToInstance(ReviewUniversityDto, { reason: '   ' });
    const valid = plainToInstance(ReviewUniversityDto, { reason: '  Missing official record  ' });
    expect(await validate(invalid)).toHaveLength(1);
    expect(await validate(valid)).toHaveLength(0);
    expect(valid.reason).toBe('Missing official record');
  });
});
