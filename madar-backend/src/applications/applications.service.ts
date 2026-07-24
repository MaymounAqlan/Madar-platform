import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Application, ApplicationDocument } from './schemas/application.schema';
import { UpdateApplicationDto } from './dto/update-application.dto';

@Injectable()
export class ApplicationsService {
  private readonly logger = new Logger(ApplicationsService.name);

  constructor(
    @InjectModel(Application.name) private applicationModel: Model<ApplicationDocument>,
  ) {}

  async findAll(query: any = {}): Promise<{ data: Application[]; total: number; page: number; limit: number }> {
    const page = parseInt(query.page, 10) || 1;
    const limit = Math.min(parseInt(query.limit, 10) || 20, 100);
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (query.jobId) filter.jobId = new Types.ObjectId(query.jobId);
    if (query.studentId) filter.studentId = new Types.ObjectId(query.studentId);
    if (query.companyId) filter.companyId = new Types.ObjectId(query.companyId);
    if (query.status) filter.status = query.status;

    const [data, total] = await Promise.all([
      this.applicationModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.applicationModel.countDocuments(filter),
    ]);

    return { data: data as Application[], total, page, limit };
  }

  async findById(id: string): Promise<Application> {
    const application = await this.applicationModel
      .findById(new Types.ObjectId(id))
      .lean();
    if (!application) {
      throw new NotFoundException('Application not found');
    }
    return application as Application;
  }

  async update(id: string, dto: UpdateApplicationDto, userId?: string): Promise<Application> {
    const application = await this.applicationModel
      .findById(new Types.ObjectId(id))
      .lean();
    if (!application) {
      throw new NotFoundException('Application not found');
    }

    const statusEntry = {
      status: dto.status,
      note: dto.note || `Status updated to ${dto.status}`,
      createdAt: new Date(),
      createdBy: userId ? new Types.ObjectId(userId) : undefined,
    };

    const updateData: any = {
      status: dto.status,
      $push: { statusHistory: statusEntry },
    };

    if (dto.interviewDate) updateData.interviewDate = new Date(dto.interviewDate);
    if (dto.interviewType) updateData.interviewType = dto.interviewType;
    if (dto.interviewNotes) updateData.interviewNotes = dto.interviewNotes;
    if (dto.rejectionReason) updateData.rejectionReason = dto.rejectionReason;
    if (dto.offerSalary) updateData.offerSalary = dto.offerSalary;

    const updated = await this.applicationModel
      .findByIdAndUpdate(new Types.ObjectId(id), updateData, { new: true })
      .lean();

    this.logger.log(`Application ${id} status updated to ${dto.status}`);
    return updated as Application;
  }

  async getStudentApplications(studentId: string): Promise<Application[]> {
    return this.applicationModel
      .find({ studentId: new Types.ObjectId(studentId) })
      .sort({ createdAt: -1 })
      .lean() as Promise<Application[]>;
  }

  async getCompanyApplications(companyId: string): Promise<Application[]> {
    return this.applicationModel
      .find({ companyId: new Types.ObjectId(companyId) })
      .sort({ createdAt: -1 })
      .lean() as Promise<Application[]>;
  }
}
