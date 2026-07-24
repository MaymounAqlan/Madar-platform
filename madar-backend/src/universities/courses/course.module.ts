import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Course, CourseSchema } from './schemas/course.schema';
import { CourseService } from './course.service';
import { CourseController } from './course.controller';
import { StudyPlan, StudyPlanSchema } from '../study-plans/schemas/study-plan.schema';
import { University, UniversitySchema } from '../schemas/university.schema';
import { CollegeCoordinator, CollegeCoordinatorSchema } from '../college-coordinators/schemas/college-coordinator.schema';
import { Skill, SkillSchema } from '../../skills/schemas/skill.schema';
import { AuditLog, AuditLogSchema } from '../../common/audit-logs/schemas/audit-log.schema';
import { AuthModule } from '../../auth/auth.module';
import { CurriculumModule } from '../curriculum/curriculum.module';

@Module({
  imports: [AuthModule, CurriculumModule, MongooseModule.forFeature([
    { name: Course.name, schema: CourseSchema }, { name: StudyPlan.name, schema: StudyPlanSchema },
    { name: University.name, schema: UniversitySchema }, { name: CollegeCoordinator.name, schema: CollegeCoordinatorSchema },
    { name: Skill.name, schema: SkillSchema }, { name: AuditLog.name, schema: AuditLogSchema },
  ])],
  controllers: [CourseController], providers: [CourseService], exports: [CourseService],
})
export class CourseModule {}
