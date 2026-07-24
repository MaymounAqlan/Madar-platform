import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StudyPlan, StudyPlanSchema } from './schemas/study-plan.schema';
import { StudyPlanImport, StudyPlanImportSchema } from './schemas/study-plan-import.schema';
import { StudyPlanService } from './study-plan.service';
import { StudyPlanController } from './study-plan.controller';
import { PdfImportService } from './pdf-import.service';
import { University, UniversitySchema } from '../schemas/university.schema';
import { CollegeCoordinator, CollegeCoordinatorSchema } from '../college-coordinators/schemas/college-coordinator.schema';
import { Department, DepartmentSchema } from '../departments/schemas/department.schema';
import { Course, CourseSchema } from '../courses/schemas/course.schema';
import { Skill, SkillSchema } from '../../skills/schemas/skill.schema';
import { AuditLog, AuditLogSchema } from '../../common/audit-logs/schemas/audit-log.schema';
import { AuthModule } from '../../auth/auth.module';
import { NotificationModule } from '../../common/notifications/notification.module';

@Module({
  imports: [AuthModule, NotificationModule, MongooseModule.forFeature([
    { name: StudyPlan.name, schema: StudyPlanSchema }, { name: StudyPlanImport.name, schema: StudyPlanImportSchema },
    { name: University.name, schema: UniversitySchema },
    { name: CollegeCoordinator.name, schema: CollegeCoordinatorSchema }, { name: Department.name, schema: DepartmentSchema },
    { name: Course.name, schema: CourseSchema }, { name: Skill.name, schema: SkillSchema }, { name: AuditLog.name, schema: AuditLogSchema },
  ])],
  controllers: [StudyPlanController], providers: [StudyPlanService, PdfImportService], exports: [StudyPlanService],
})
export class StudyPlanModule {}
