import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CollegeCoordinator, CollegeCoordinatorSchema } from './schemas/college-coordinator.schema';
import { CollegeCoordinatorService } from './college-coordinator.service';
import { CollegeCoordinatorController } from './college-coordinator.controller';
import { User, UserSchema } from '../../users/schemas/user.schema';
import { University, UniversitySchema } from '../schemas/university.schema';
import { College, CollegeSchema } from '../colleges/schemas/college.schema';
import { AuditLog, AuditLogSchema } from '../../common/audit-logs/schemas/audit-log.schema';
import { AuthModule } from '../../auth/auth.module';
import { NotificationModule } from '../../common/notifications/notification.module';
import { UniversityStatusGuard } from '../university-status.guard';

@Module({
  imports: [
    AuthModule,
    NotificationModule,
    MongooseModule.forFeature([
      { name: CollegeCoordinator.name, schema: CollegeCoordinatorSchema },
      { name: User.name, schema: UserSchema },
      { name: University.name, schema: UniversitySchema },
      { name: College.name, schema: CollegeSchema },
      { name: AuditLog.name, schema: AuditLogSchema },
    ]),
  ],
  controllers: [CollegeCoordinatorController],
  providers: [CollegeCoordinatorService, UniversityStatusGuard],
  exports: [CollegeCoordinatorService],
})
export class CollegeCoordinatorModule {}
