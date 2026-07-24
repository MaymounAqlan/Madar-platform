import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { createHash } from 'crypto';
import { Model } from 'mongoose';
import { CreateContactRequestDto } from './dto/create-contact-request.dto';
import {
  ContactRequest,
  ContactRequestDocument,
} from './schemas/contact-request.schema';

@Injectable()
export class SupportService {
  constructor(
    @InjectModel(ContactRequest.name)
    private readonly contactRequestModel: Model<ContactRequestDocument>,
    private readonly configService: ConfigService,
  ) {}

  async createContactRequest(
    dto: CreateContactRequestDto,
    clientAddress: string,
  ) {
    if (dto.website?.trim()) {
      throw new BadRequestException({
        code: 'CONTACT_REQUEST_REJECTED',
        message: 'Contact request could not be accepted',
      });
    }

    const hashSalt =
      this.configService.get<string>('CONTACT_HASH_SALT') ||
      this.configService.get<string>('JWT_SECRET') ||
      'madar-contact-rate-limit';
    const ipHash = this.hash(`${hashSalt}:${clientAddress || 'unknown'}`);
    const normalizedMessage = `${dto.email}|${dto.subject}|${dto.message}`
      .toLocaleLowerCase()
      .replace(/\s+/g, ' ')
      .trim();
    const messageHash = this.hash(normalizedMessage);

    const rateLimitWindow = new Date(Date.now() - 15 * 60 * 1000);
    const recentRequests = await this.contactRequestModel.countDocuments({
      ipHash,
      createdAt: { $gte: rateLimitWindow },
    });
    if (recentRequests >= 5) {
      throw new HttpException(
        {
          code: 'CONTACT_RATE_LIMIT',
          message: 'Too many contact requests. Please try again later.',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const duplicateWindow = new Date(Date.now() - 10 * 60 * 1000);
    const duplicate = await this.contactRequestModel
      .findOne({
        messageHash,
        createdAt: { $gte: duplicateWindow },
      })
      .select('_id')
      .lean();
    if (duplicate) {
      throw new ConflictException({
        code: 'CONTACT_REQUEST_DUPLICATE',
        message: 'This contact request was already submitted.',
      });
    }

    const created = await this.contactRequestModel.create({
      name: dto.name,
      email: dto.email,
      requesterType: dto.requesterType,
      subject: dto.subject,
      message: dto.message,
      language: dto.language || 'ar',
      status: 'new',
      ipHash,
      messageHash,
    });

    return {
      requestId: created._id.toString(),
      status: created.status,
      submittedAt: created.createdAt,
    };
  }

  private hash(value: string): string {
    return createHash('sha256').update(value).digest('hex');
  }
}
