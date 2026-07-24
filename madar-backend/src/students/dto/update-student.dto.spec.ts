import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UpdateStudentDto } from './update-student.dto';

describe('UpdateStudentDto location contract', () => {
  it('accepts a formatted address with valid coordinates', async () => {
    const dto = plainToInstance(UpdateStudentDto, {
      address: 'صنعاء، اليمن',
      latitude: 15.3694,
      longitude: 44.191,
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it('rejects coordinates outside geographic bounds', async () => {
    const dto = plainToInstance(UpdateStudentDto, {
      address: 'Invalid location',
      latitude: 100,
      longitude: 200,
    });

    const errors = await validate(dto);
    expect(errors.map((error) => error.property)).toEqual(expect.arrayContaining(['latitude', 'longitude']));
  });
});
