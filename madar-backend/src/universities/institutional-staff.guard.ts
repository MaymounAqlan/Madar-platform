import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from '../users/schemas/user.schema';
import { University, UniversityDocument } from './schemas/university.schema';
import { CollegeCoordinator, CollegeCoordinatorDocument } from './college-coordinators/schemas/college-coordinator.schema';

const STAFF_ROLES = ['coordinator', 'university_viewer', 'data_officer', 'quality_officer', 'academic_development_officer'];

@Injectable()
export class InstitutionalStaffGuard implements CanActivate {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(University.name) private readonly universityModel: Model<UniversityDocument>,
    @InjectModel(CollegeCoordinator.name) private readonly staffModel: Model<CollegeCoordinatorDocument>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const principal = request.user;
    if (!principal?.sub) throw new UnauthorizedException('Authenticated user is unavailable');
    if (!STAFF_ROLES.includes(principal.role)) return true;

    const user = await this.userModel.findById(new Types.ObjectId(principal.sub)).select('status userType').lean();
    if (!user || user.userType !== principal.role || user.status !== 'active') {
      throw new ForbiddenException({ code: 'INSTITUTIONAL_STAFF_INACTIVE', message: 'Staff account is inactive' });
    }

    const staff = await this.staffModel.findOne({
      userId: user._id,
      role: principal.role,
      status: 'active',
      invitationStatus: 'accepted',
    }).lean();
    if (!staff) {
      throw new ForbiddenException({ code: 'INSTITUTIONAL_ACCESS_REVOKED', message: 'Institutional access is unavailable' });
    }

    const university = await this.universityModel.findOne({ _id: staff.universityId, status: 'active' }).select('_id status').lean();
    if (!university) {
      throw new ForbiddenException({ code: 'UNIVERSITY_INACTIVE', message: 'University portal access is unavailable' });
    }

    request.institutionalAccess = {
      universityId: String(staff.universityId),
      collegeId: staff.collegeId ? String(staff.collegeId) : null,
      role: staff.role,
      permissions: staff.permissions || [],
    };
    return true;
  }
}
