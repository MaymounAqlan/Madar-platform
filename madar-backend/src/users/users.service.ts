import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { EmailService } from '../common/services/email.service';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly emailService: EmailService,
  ) {}

  async create(dto: CreateUserDto): Promise<User> {
    const email = dto.email.toLowerCase();
    const existing = await this.userModel.findOne({ email }).lean();
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = await this.userModel.create({
      firstName: dto.firstName,
      firstNameAr: dto.firstNameAr,
      lastName: dto.lastName,
      lastNameAr: dto.lastNameAr,
      email,
      phone: dto.phone,
      password: hashedPassword,
      userType: dto.role,
      status: dto.status || 'active',
      isEmailVerified: false,
    });

    this.logger.log(`User created by admin: ${user.email}`);
    return this.sanitizeUser(user) as User;
  }

  async findAll(query: any = {}): Promise<{ data: User[]; total: number; page: number; limit: number }> {
    const page = parseInt(query.page, 10) || 1;
    const limit = Math.min(parseInt(query.limit, 10) || 20, 100);
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (query.role) filter.userType = query.role;
    if (query.status) filter.status = query.status;
    if (query.search) {
      filter.$or = [
        { firstName: { $regex: query.search, $options: 'i' } },
        { lastName: { $regex: query.search, $options: 'i' } },
        { email: { $regex: query.search, $options: 'i' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.userModel
        .find(filter)
        .select('-password -refreshTokens -twoFactorSecret')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.userModel.countDocuments(filter),
    ]);

    return { data: data.map((user) => this.sanitizeUser(user) as User), total, page, limit };
  }

  async findById(id: string): Promise<User> {
    const user = await this.userModel
      .findById(new Types.ObjectId(id))
      .select('-password')
      .lean();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.sanitizeUser(user) as User;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ email: email.toLowerCase() }).lean() as Promise<User | null>;
  }

  async update(id: string, updateData: Partial<User>): Promise<User> {
    const data: any = { ...updateData };
    const rawPassword = data.password;
    if ((data as any).role && !(data as any).userType) {
      data.userType = (data as any).role;
      delete data.role;
    }
    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }

    const user = await this.userModel
      .findByIdAndUpdate(new Types.ObjectId(id), data, { new: true })
      .select('-password -refreshTokens -twoFactorSecret')
      .lean();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (rawPassword) {
      try {
        const name = [user.firstNameAr, user.lastNameAr].filter(Boolean).join(' ') || user.firstName || 'مستخدم مدار';
        await this.emailService.sendCustomTemplateEmail(
          user.email,
          'general_notification',
          {
            userName: name,
            reason: `تم تحديث كلمة المرور الخاصة بحسابك من قبل الإدارة بنجاح. كلمة المرور الجديدة للدخول هي: ${rawPassword}`,
          },
          'ar',
        );
        this.logger.log(`Password update notification sent to user: ${user.email}`);
      } catch (mailError: any) {
        this.logger.warn(`Failed to send password update email to ${user.email}: ${mailError.message}`);
      }
    }

    return this.sanitizeUser(user) as User;
  }

  async updateStatus(id: string, status: string): Promise<User> {
    const user = await this.userModel
      .findByIdAndUpdate(new Types.ObjectId(id), { status }, { new: true })
      .select('-password -refreshTokens -twoFactorSecret')
      .lean();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    this.logger.log(`User ${id} status updated to ${status}`);
    return this.sanitizeUser(user) as User;
  }

  async remove(id: string): Promise<void> {
    const result = await this.userModel.deleteOne({ _id: new Types.ObjectId(id) });
    if (result.deletedCount === 0) {
      throw new NotFoundException('User not found');
    }
    this.logger.log(`User deleted: ${id}`);
  }

  private sanitizeUser(user: any) {
    const obj = user.toObject ? user.toObject() : user;
    const { password, refreshTokens, twoFactorSecret, ...sanitized } = obj;
    return {
      ...sanitized,
      id: sanitized.id || sanitized._id?.toString?.() || sanitized._id,
      role: sanitized.role || sanitized.userType || 'student',
      userType: sanitized.userType || sanitized.role || 'student',
      isEmailVerified: sanitized.isEmailVerified ?? sanitized.emailVerified ?? false,
    };
  }
}
