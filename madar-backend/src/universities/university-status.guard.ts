import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from '../users/schemas/user.schema';
import { University, UniversityDocument } from './schemas/university.schema';
import { SKIP_UNIVERSITY_STATUS_KEY } from './university-status.decorator';

@Injectable()
export class UniversityStatusGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(University.name) private readonly universityModel: Model<UniversityDocument>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const skip = this.reflector.getAllAndOverride<boolean>(SKIP_UNIVERSITY_STATUS_KEY, [
      context.getHandler(), context.getClass(),
    ]);
    const request = context.switchToHttp().getRequest();
    const principal = request.user;
    if (!principal?.sub) throw new UnauthorizedException({ code: 'USER_INACTIVE', message: 'Authenticated user is unavailable' });
    if (principal.role !== 'university') return true;

    const user = await this.userModel.findById(new Types.ObjectId(principal.sub)).select('status userType').lean();
    if (!user || ['inactive', 'banned', 'deleted'].includes(user.status)) {
      throw new ForbiddenException({ code: 'USER_INACTIVE', message: 'User account is inactive' });
    }
    if (user.status === 'suspended') {
      throw new ForbiddenException({ code: 'USER_SUSPENDED', message: 'User account is suspended' });
    }
    if (skip) return true;

    const university = await this.universityModel.findOne({ userId: user._id }).select('status').lean();
    const status = university?.status || 'inactive';
    if (status === 'active') return true;
    if (status === 'pending') {
      throw new ForbiddenException({ code: 'UNIVERSITY_PENDING_APPROVAL', message: 'University approval is pending' });
    }
    if (status === 'suspended') {
      throw new ForbiddenException({ code: 'UNIVERSITY_SUSPENDED', message: 'University is suspended' });
    }
    throw new ForbiddenException({ code: 'UNIVERSITY_INACTIVE', message: 'University is inactive' });
  }
}
