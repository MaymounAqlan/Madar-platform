import { BadRequestException } from '@nestjs/common';
import { UniversityDirectoryService } from './university-directory.service';

const query = (value: unknown) => {
  const chain: any = { lean: jest.fn().mockResolvedValue(value) };
  for (const method of ['select', 'sort', 'skip', 'limit']) chain[method] = jest.fn().mockReturnValue(chain);
  return chain;
};

describe('UniversityDirectoryService', () => {
  const universityModel: any = {
    find: jest.fn(), countDocuments: jest.fn(), findOne: jest.fn(), exists: jest.fn(), findOneAndUpdate: jest.fn(),
  };
  const collegeModel: any = { find: jest.fn(), countDocuments: jest.fn(), findOne: jest.fn(), exists: jest.fn(), findOneAndUpdate: jest.fn() };
  const departmentModel: any = { find: jest.fn(), countDocuments: jest.fn(), findOne: jest.fn(), exists: jest.fn(), findOneAndUpdate: jest.fn() };
  const programModel: any = { find: jest.fn(), countDocuments: jest.fn(), exists: jest.fn(), findOneAndUpdate: jest.fn() };
  const service = new UniversityDirectoryService(universityModel, collegeModel, departmentModel, programModel);

  beforeEach(() => jest.clearAllMocks());

  it('returns a paginated public contract without exposing internal analytics', async () => {
    universityModel.find.mockReturnValue(query([{ _id: 'u1', nameAr: 'جامعة صنعاء', nameEn: "Sana'a University", logoUrl: '/uploads/universities/sanaa.png', governorate: 'صنعاء', institutionType: 'public_university', ownership: 'public', verificationStatus: 'verified' }]));
    universityModel.countDocuments.mockResolvedValue(1);
    const result = await service.listUniversities({ search: 'صنعاء', page: '1', limit: '20' });
    expect(result).toEqual(expect.objectContaining({ items: [expect.objectContaining({ id: 'u1', nameAr: 'جامعة صنعاء', logoUrl: '/uploads/universities/sanaa.png' })], pagination: { page: 1, limit: 20, total: 1, totalPages: 1 } }));
    expect(universityModel.find).toHaveBeenCalledWith(expect.objectContaining({ isActive: true, deletedAt: { $exists: false }, $or: expect.any(Array) }));
  });

  it('keeps a dry-run idempotent and performs no writes', async () => {
    universityModel.findOne.mockReturnValue(query(null));
    const result = await service.importDirectory([{ nameAr: 'جامعة اختبار موثقة', slug: 'verified-test-university', institutionType: 'public_university', ownership: 'public', governorate: 'صنعاء', sourceUrls: ['https://example.edu/source'], verificationStatus: 'verified', dataSource: 'unit-test', isSeedData: true, isDemo: false, isActive: true, colleges: [] }], { dryRun: true });
    expect(result.created).toEqual(['verified-test-university']);
    expect(universityModel.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it('counts a documented department degree as an academic program during dry-run', async () => {
    universityModel.findOne.mockReturnValue(query(null));
    const result = await service.importDirectory([{
      nameAr: 'جامعة اختبار موثقة',
      slug: 'verified-test-university',
      institutionType: 'public_university',
      ownership: 'public',
      governorate: 'تعز',
      sourceUrls: ['https://example.edu/source'],
      verificationStatus: 'verified',
      dataSource: 'unit-test',
      isSeedData: true,
      isDemo: false,
      isActive: true,
      colleges: [{
        nameAr: 'كلية الاختبار',
        slug: 'test-college',
        departments: [{ nameAr: 'قسم علوم الحاسوب', slug: 'computer-science', degreeType: 'bachelor' }],
      }],
    }], { dryRun: true });

    expect(result.colleges.created).toBe(1);
    expect(result.departments.created).toBe(1);
    expect(result.majors.created).toBe(1);
    expect(programModel.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it('rejects malformed identifiers before querying dependent collections', async () => {
    await expect(service.listColleges('not-an-object-id')).rejects.toBeInstanceOf(BadRequestException);
    expect(collegeModel.find).not.toHaveBeenCalled();
  });
});
