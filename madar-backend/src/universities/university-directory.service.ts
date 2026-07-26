import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import axios from 'axios';
import { createHash } from 'crypto';
import { mkdir, unlink, writeFile } from 'fs/promises';
import { join, resolve } from 'path';
import { Model, Types } from 'mongoose';
import { University, UniversityDocument } from './schemas/university.schema';
import { College, CollegeDocument } from './colleges/schemas/college.schema';
import { Department, DepartmentDocument } from './departments/schemas/department.schema';
import { AcademicProgram, AcademicProgramDocument } from './academic-programs/schemas/academic-program.schema';

export type VerificationStatus = 'verified' | 'partially_verified' | 'unverified';

export interface YemenDirectoryProgramInput {
  nameAr: string;
  nameEn?: string;
  slug: string;
  code?: string;
  degreeType?: string;
  sourceUrls?: string[];
  verificationStatus?: VerificationStatus;
}

export interface YemenDirectoryDepartmentInput {
  nameAr: string;
  nameEn?: string;
  slug: string;
  code?: string;
  degreeType?: string;
  sourceUrls?: string[];
  verificationStatus?: VerificationStatus;
  majors?: YemenDirectoryProgramInput[];
}

export interface YemenDirectoryCollegeInput {
  nameAr: string;
  nameEn?: string;
  slug: string;
  institutionType?: 'university_college' | 'standalone_college' | 'community_college';
  governorate?: string;
  city?: string;
  website?: string | null;
  sourceUrls?: string[];
  verificationStatus?: VerificationStatus;
  departments?: YemenDirectoryDepartmentInput[];
}

export interface YemenDirectoryUniversityInput {
  nameAr: string;
  nameEn?: string;
  slug: string;
  aliases?: string[];
  institutionType: 'public_university' | 'private_university' | 'community_college' | 'university_college' | 'institute' | 'academy';
  ownership: 'public' | 'private' | 'mixed';
  governorate: string;
  city?: string;
  website?: string | null;
  officialEmail?: string | null;
  phoneNumbers?: string[];
  logoSourceUrl?: string | null;
  sourceUrls: string[];
  verificationStatus: VerificationStatus;
  accreditationStatus?: 'accredited' | 'licensed' | 'pending' | 'unknown';
  dataSource: string;
  isSeedData: boolean;
  isDemo: boolean;
  isActive: boolean;
  sortOrder?: number;
  colleges?: YemenDirectoryCollegeInput[];
}

export interface DirectoryImportResult {
  dryRun: boolean;
  created: string[];
  updated: string[];
  skipped: Array<{ slug: string; reason: string }>;
  failed: Array<{ slug: string; reason: string }>;
  logos: { stored: number; skipped: number; failed: number };
  colleges: { created: number; updated: number };
  departments: { created: number; updated: number };
  majors: { created: number; updated: number };
}

@Injectable()
export class UniversityDirectoryService {
  private readonly logger = new Logger(UniversityDirectoryService.name);

  constructor(
    @InjectModel(University.name) private readonly universityModel: Model<UniversityDocument>,
    @InjectModel(College.name) private readonly collegeModel: Model<CollegeDocument>,
    @InjectModel(Department.name) private readonly departmentModel: Model<DepartmentDocument>,
    @InjectModel(AcademicProgram.name) private readonly programModel: Model<AcademicProgramDocument>,
  ) {}

  async listUniversities(query: Record<string, string> = {}) {
    const page = this.parsePositive(query.page, 1);
    const limit = Math.min(this.parsePositive(query.limit, 20), 100);
    const filter: Record<string, any> = { isActive: query.isActive === 'false' ? false : true, deletedAt: { $exists: false } };
    if (query.search?.trim()) {
      const expression = new RegExp(this.escapeRegex(this.normalizeWhitespace(query.search)), 'i');
      filter.$or = [{ nameAr: expression }, { nameEn: expression }, { name: expression }, { aliases: expression }];
    }
    if (query.governorate) filter.governorate = query.governorate;
    if (query.institutionType) filter.institutionType = query.institutionType;
    if (query.ownership) filter.ownership = query.ownership;

    const [items, total] = await Promise.all([
      this.universityModel.find(filter)
        .select('name nameAr nameEn slug logoUrl branding governorate city institutionType ownership website verificationStatus')
        .sort({ sortOrder: 1, nameAr: 1, name: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      this.universityModel.countDocuments(filter),
    ]);
    return {
      items: items.map((item: any) => this.toUniversityListItem(item)),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getUniversity(universityId: string) {
    const university = await this.universityModel.findOne({ _id: this.asObjectId(universityId), isActive: true, deletedAt: { $exists: false } })
      .select('-analytics -rankings -statistics -scores -settings -colleges')
      .lean();
    if (!university) throw new NotFoundException('University not found');
    return this.toUniversityListItem(university as any, true);
  }

  async listColleges(universityId: string, query: Record<string, string> = {}) {
    const id = this.asObjectId(universityId);
    await this.assertActiveUniversity(id);
    const page = this.parsePositive(query.page, 1);
    const limit = Math.min(this.parsePositive(query.limit, 50), 100);
    const filter: Record<string, any> = { universityId: id, isActive: true, deletedAt: { $exists: false }, 'metadata.status': { $nin: ['archived', 'deleted'] } };
    if (query.search?.trim()) {
      const expression = new RegExp(this.escapeRegex(this.normalizeWhitespace(query.search)), 'i');
      filter.$or = [{ nameAr: expression }, { nameEn: expression }, { name: expression }, { code: expression }];
    }
    const [items, total] = await Promise.all([
      this.collegeModel.find(filter).select('name nameAr nameEn slug code logoUrl governorate city institutionType verificationStatus').sort({ nameAr: 1, name: 1 }).skip((page - 1) * limit).limit(limit).lean(),
      this.collegeModel.countDocuments(filter),
    ]);
    return { items: items.map((item: any) => ({ id: String(item._id), name: item.name || item.nameAr, nameAr: item.nameAr || item.name, nameEn: item.nameEn || '', slug: item.slug || '', code: item.code || '', logoUrl: item.logoUrl || null, governorate: item.governorate || '', city: item.city || '', institutionType: item.institutionType || 'university_college', verificationStatus: item.verificationStatus || 'unverified' })), pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async listDepartments(collegeId: string, query: Record<string, string> = {}) {
    const id = this.asObjectId(collegeId);
    const college = await this.collegeModel.findOne({ _id: id, isActive: true, deletedAt: { $exists: false }, 'metadata.status': { $nin: ['archived', 'deleted'] } }).select('universityId').lean();
    if (!college) throw new NotFoundException('College not found');
    if ((college as any).universityId) await this.assertActiveUniversity((college as any).universityId);
    const page = this.parsePositive(query.page, 1);
    const limit = Math.min(this.parsePositive(query.limit, 50), 100);
    const filter: Record<string, any> = { collegeId: id, isActive: true, deletedAt: { $exists: false }, 'metadata.status': { $nin: ['archived', 'deleted'] } };
    if (query.search?.trim()) {
      const expression = new RegExp(this.escapeRegex(this.normalizeWhitespace(query.search)), 'i');
      filter.$or = [{ nameAr: expression }, { nameEn: expression }, { name: expression }, { code: expression }];
    }
    const [items, total] = await Promise.all([
      this.departmentModel.find(filter).select('name nameAr nameEn slug code verificationStatus').sort({ nameAr: 1, name: 1 }).skip((page - 1) * limit).limit(limit).lean(),
      this.departmentModel.countDocuments(filter),
    ]);
    return { items: items.map((item: any) => ({ id: String(item._id), name: item.name || item.nameAr, nameAr: item.nameAr || item.name, nameEn: item.nameEn || '', slug: item.slug || '', code: item.code || '', verificationStatus: item.verificationStatus || 'unverified' })), pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async listMajors(departmentId: string, query: Record<string, string> = {}) {
    const id = this.asObjectId(departmentId);
    const department = await this.departmentModel.findOne({ _id: id, isActive: true, deletedAt: { $exists: false }, 'metadata.status': { $nin: ['archived', 'deleted'] } }).lean();
    if (!department) throw new NotFoundException('Department not found');
    const page = this.parsePositive(query.page, 1);
    const limit = Math.min(this.parsePositive(query.limit, 50), 100);
    const filter: Record<string, any> = { departmentId: id, isActive: true, deletedAt: { $exists: false } };
    if (query.search?.trim()) {
      const expression = new RegExp(this.escapeRegex(this.normalizeWhitespace(query.search)), 'i');
      filter.$or = [{ nameAr: expression }, { nameEn: expression }, { code: expression }];
    }
    const [items, total] = await Promise.all([
      this.programModel.find(filter).select('nameAr nameEn slug code degreeType verificationStatus').sort({ nameAr: 1 }).skip((page - 1) * limit).limit(limit).lean(),
      this.programModel.countDocuments(filter),
    ]);
    return { items: items.map((item: any) => ({ id: String(item._id), name: item.nameAr, nameAr: item.nameAr, nameEn: item.nameEn || '', slug: item.slug, code: item.code || '', degreeType: item.degreeType || '', verificationStatus: item.verificationStatus || 'unverified' })), pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async importDirectory(records: YemenDirectoryUniversityInput[], options: { dryRun: boolean; downloadLogos?: boolean }): Promise<DirectoryImportResult> {
    const result: DirectoryImportResult = { dryRun: options.dryRun, created: [], updated: [], skipped: [], failed: [], logos: { stored: 0, skipped: 0, failed: 0 }, colleges: { created: 0, updated: 0 }, departments: { created: 0, updated: 0 }, majors: { created: 0, updated: 0 } };
    for (const record of records) {
      try {
        this.validateRecord(record);
        const slug = this.normalizeSlug(record.slug);
        const existing: any = await this.universityModel.findOne({ slug }).lean();
        if (existing && !existing.isSeedData && existing.dataSource !== record.dataSource) {
          result.skipped.push({ slug, reason: 'A manually managed university already uses this slug' });
          continue;
        }
        if (options.dryRun) {
          (existing ? result.updated : result.created).push(slug);
          await this.countNestedDryRun(record, result);
          continue;
        }

        let logo: { logoUrl?: string; logoStorageKey?: string } = {};
        if (options.downloadLogos && record.logoSourceUrl) {
          try {
            logo = await this.downloadLogo(record.logoSourceUrl, slug);
            result.logos.stored += 1;
          } catch (error: any) {
            result.logos.failed += 1;
            this.logger.warn(`Logo skipped for ${slug}: ${error?.message || error}`);
          }
        } else {
          result.logos.skipped += 1;
        }

        const university: any = await this.universityModel.findOneAndUpdate(
          { slug },
          { $set: {
            name: record.nameEn || record.nameAr,
            nameAr: this.normalizeWhitespace(record.nameAr),
            nameEn: record.nameEn || undefined,
            slug,
            aliases: this.uniqueAliases(record.aliases || [], record.nameAr, record.nameEn),
            institutionType: record.institutionType,
            ownership: record.ownership,
            type: record.ownership === 'public' ? 'government' : 'private',
            status: 'active',
            accreditationStatus: record.accreditationStatus || 'unknown',
            governorate: record.governorate,
            city: record.city || record.governorate,
            website: record.website || undefined,
            officialEmail: record.officialEmail || undefined,
            phoneNumbers: record.phoneNumbers || [],
            sourceUrls: record.sourceUrls,
            verificationStatus: record.verificationStatus,
            dataSource: record.dataSource,
            isSeedData: record.isSeedData,
            isDemo: record.isDemo,
            isActive: record.isActive,
            sortOrder: record.sortOrder || 0,
            lastVerifiedAt: new Date(),
            location: { city: record.city || record.governorate, country: 'Yemen', address: '', coordinates: {} },
            contactInfo: { email: record.officialEmail || '', phone: record.phoneNumbers?.[0] || '', website: record.website || '', hrEmail: '' },
            ...(logo.logoUrl ? { logoUrl: logo.logoUrl, logoStorageKey: logo.logoStorageKey, branding: { logoUrl: logo.logoUrl, primaryColor: '#9FE870', secondaryColor: '#0E0F0C' } } : {}),
          } },
          { upsert: true, new: true, setDefaultsOnInsert: true },
        );
        (existing ? result.updated : result.created).push(slug);
        await this.importColleges(university._id, record, result);
      } catch (error: any) {
        result.failed.push({ slug: record?.slug || '(missing)', reason: error?.message || String(error) });
      }
    }
    return result;
  }

  async storeUploadedLogo(universityId: string, file?: Express.Multer.File) {
    const university: any = await this.universityModel.findOne({ _id: this.asObjectId(universityId), deletedAt: { $exists: false } }).lean();
    if (!university) throw new NotFoundException('University not found');
    if (!file?.buffer?.length) throw new BadRequestException('Logo file is required');
    if (file.size > 5 * 1024 * 1024) throw new BadRequestException('Logo must not exceed 5 MB');
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.mimetype)) throw new BadRequestException('Only PNG, JPEG, and WebP logos are supported');
    const extension = this.detectImageExtension(file.buffer);
    const digest = createHash('sha256').update(file.buffer).digest('hex').slice(0, 12);
    const safeSlug = this.normalizeSlug(university.slug || String(university._id));
    const fileName = `${safeSlug}-${digest}.${extension}`;
    const relativePath = join('uploads', 'universities', fileName).replace(/\\/g, '/');
    const outputDirectory = resolve(process.cwd(), 'uploads', 'universities');
    await mkdir(outputDirectory, { recursive: true });
    await writeFile(resolve(outputDirectory, fileName), file.buffer);
    await this.universityModel.updateOne({ _id: university._id }, { $set: { logoUrl: `/${relativePath}`, logoStorageKey: relativePath, logoAltAr: `شعار ${university.nameAr || university.name}`, logoAltEn: `${university.nameEn || university.name || 'University'} logo`, 'branding.logoUrl': `/${relativePath}` } });
    if (university.logoStorageKey && university.logoStorageKey !== relativePath && /^uploads\/universities\//.test(university.logoStorageKey)) {
      const previous = resolve(process.cwd(), university.logoStorageKey);
      if (previous.startsWith(outputDirectory)) await unlink(previous).catch(() => undefined);
    }
    return { universityId: String(university._id), logoUrl: `/${relativePath}`, logoStorageKey: relativePath };
  }

  private async importColleges(universityId: Types.ObjectId, university: YemenDirectoryUniversityInput, result: DirectoryImportResult) {
    for (const collegeInput of university.colleges || []) {
      const slug = this.normalizeSlug(collegeInput.slug);
      const previous = await this.collegeModel.exists({ universityId, slug });
      const college: any = await this.collegeModel.findOneAndUpdate(
        { universityId, slug },
        { $set: { universityId, name: collegeInput.nameEn || collegeInput.nameAr, nameAr: collegeInput.nameAr, nameEn: collegeInput.nameEn || undefined, slug, institutionType: collegeInput.institutionType || 'university_college', governorate: collegeInput.governorate || university.governorate, city: collegeInput.city || university.city || university.governorate, website: collegeInput.website || undefined, sourceUrls: collegeInput.sourceUrls || university.sourceUrls, verificationStatus: collegeInput.verificationStatus || 'partially_verified', isActive: true, metadata: { status: 'active', source: university.dataSource } } },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );
      result.colleges[previous ? 'updated' : 'created'] += 1;
      for (const departmentInput of collegeInput.departments || []) {
        const departmentSlug = this.normalizeSlug(departmentInput.slug);
        const previousDepartment = await this.departmentModel.exists({ collegeId: college._id, slug: departmentSlug });
        const department: any = await this.departmentModel.findOneAndUpdate(
          { collegeId: college._id, slug: departmentSlug },
          { $set: { universityId, collegeId: college._id, name: departmentInput.nameEn || departmentInput.nameAr, nameAr: departmentInput.nameAr, nameEn: departmentInput.nameEn || undefined, slug: departmentSlug, code: departmentInput.code || undefined, isActive: true, sourceUrls: departmentInput.sourceUrls || collegeInput.sourceUrls || university.sourceUrls, verificationStatus: departmentInput.verificationStatus || collegeInput.verificationStatus || 'partially_verified', metadata: { status: 'active', source: university.dataSource } } },
          { upsert: true, new: true, setDefaultsOnInsert: true },
        );
        result.departments[previousDepartment ? 'updated' : 'created'] += 1;
        const programInputs = departmentInput.majors?.length
          ? departmentInput.majors
          : departmentInput.degreeType
            ? [this.createDefaultProgram(departmentInput)]
            : [];
        for (const programInput of programInputs) {
          const programSlug = this.normalizeSlug(programInput.slug);
          const previousProgram = await this.programModel.exists({ departmentId: department._id, slug: programSlug });
          await this.programModel.findOneAndUpdate(
            { departmentId: department._id, slug: programSlug },
            { $set: { universityId, collegeId: college._id, departmentId: department._id, nameAr: programInput.nameAr, nameEn: programInput.nameEn || undefined, slug: programSlug, code: programInput.code || undefined, degreeType: programInput.degreeType || undefined, sourceUrls: programInput.sourceUrls || departmentInput.sourceUrls || collegeInput.sourceUrls || university.sourceUrls, verificationStatus: programInput.verificationStatus || departmentInput.verificationStatus || collegeInput.verificationStatus || 'partially_verified', isActive: true } },
            { upsert: true, setDefaultsOnInsert: true },
          );
          result.majors[previousProgram ? 'updated' : 'created'] += 1;
        }
      }
    }
  }

  private async countNestedDryRun(record: YemenDirectoryUniversityInput, result: DirectoryImportResult) {
    for (const college of record.colleges || []) {
      result.colleges.created += 1;
      for (const department of college.departments || []) {
        result.departments.created += 1;
        result.majors.created += department.majors?.length || (department.degreeType ? 1 : 0);
      }
    }
  }

  private createDefaultProgram(department: YemenDirectoryDepartmentInput): YemenDirectoryProgramInput {
    const degreeType = department.degreeType || 'bachelor';
    const degreeLabel = degreeType === 'licentiate' ? 'ليسانس' : 'بكالوريوس';
    const subject = this.normalizeWhitespace(department.nameAr).replace(/^قسم\s+/, '');
    const slugPrefix = degreeType === 'licentiate' ? 'lic' : 'bsc';
    return {
      nameAr: `${degreeLabel} ${subject}`,
      slug: `${slugPrefix}-${this.normalizeSlug(department.slug)}`,
      degreeType,
      sourceUrls: department.sourceUrls,
      verificationStatus: department.verificationStatus,
    };
  }

  private async downloadLogo(sourceUrl: string, slug: string) {
    const response = await axios.get<ArrayBuffer>(sourceUrl, { responseType: 'arraybuffer', timeout: 15000, maxContentLength: 5 * 1024 * 1024, maxBodyLength: 5 * 1024 * 1024 });
    const buffer = Buffer.from(response.data);
    const extension = this.detectImageExtension(buffer);
    const digest = createHash('sha256').update(buffer).digest('hex').slice(0, 12);
    const fileName = `${slug}-${digest}.${extension}`;
    const relativePath = join('uploads', 'universities', fileName).replace(/\\/g, '/');
    const outputDirectory = join(process.cwd(), 'uploads', 'universities');
    await mkdir(outputDirectory, { recursive: true });
    await writeFile(join(outputDirectory, fileName), buffer);
    return { logoUrl: `/${relativePath}`, logoStorageKey: relativePath };
  }

  private detectImageExtension(buffer: Buffer): 'png' | 'jpg' | 'webp' {
    if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png';
    if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'jpg';
    if (buffer.length >= 12 && buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP') return 'webp';
    throw new BadRequestException('Logo content is not PNG, JPEG, or WebP');
  }

  private toUniversityListItem(item: any, detailed = false) {
    const value: Record<string, any> = { id: String(item._id), name: item.nameAr || item.name, nameAr: item.nameAr || item.name || '', nameEn: item.nameEn || '', logoUrl: item.logoUrl || item.branding?.logoUrl || null, governorate: item.governorate || item.location?.city || '', city: item.city || item.location?.city || '', institutionType: item.institutionType || (item.type === 'private' ? 'private_university' : 'public_university'), ownership: item.ownership || (item.type === 'private' ? 'private' : 'public'), website: item.website || item.contactInfo?.website || null, verificationStatus: item.verificationStatus || 'unverified' };
    if (detailed) Object.assign(value, { slug: item.slug || '', aliases: item.aliases || [], accreditationStatus: item.accreditationStatus || 'unknown', officialEmail: item.officialEmail || item.contactInfo?.email || null, phoneNumbers: item.phoneNumbers || [], sourceUrls: item.sourceUrls || [], lastVerifiedAt: item.lastVerifiedAt || null });
    return value;
  }

  private validateRecord(record: YemenDirectoryUniversityInput) {
    if (!record?.nameAr?.trim() || !record?.slug?.trim() || !record?.governorate?.trim()) throw new BadRequestException('nameAr, slug, and governorate are required');
    if (!record.sourceUrls?.length) throw new BadRequestException(`At least one source URL is required for ${record.slug}`);
    for (const url of [...record.sourceUrls, record.website, record.logoSourceUrl].filter(Boolean) as string[]) {
      try { new URL(url); } catch { throw new BadRequestException(`Invalid URL in ${record.slug}: ${url}`); }
    }
  }

  private async assertActiveUniversity(id: Types.ObjectId) {
    if (!await this.universityModel.exists({ _id: id, isActive: true, deletedAt: { $exists: false } })) throw new NotFoundException('University not found');
  }

  private asObjectId(value: string) {
    if (!Types.ObjectId.isValid(value)) {
      throw new BadRequestException({ code: 'INVALID_ID', message: 'Invalid identifier' });
    }
    return new Types.ObjectId(value);
  }

  private parsePositive(value: string | undefined, fallback: number) {
    const parsed = Number.parseInt(value || '', 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
  }

  private normalizeWhitespace(value: string) { return value.trim().replace(/\s+/g, ' '); }
  private normalizeSlug(value: string) { return value.trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '').replace(/-{2,}/g, '-'); }
  private escapeRegex(value: string) { return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
  private uniqueAliases(aliases: string[], nameAr: string, nameEn?: string) { return [...new Set([nameAr, nameEn, ...aliases].filter(Boolean).map((value) => this.normalizeWhitespace(String(value))))]; }
}
