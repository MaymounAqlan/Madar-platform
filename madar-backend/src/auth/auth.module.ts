import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtAuthGuard } from './auth.guard';
import { RolesGuard } from './roles.guard';
import { PermissionsGuard } from './permissions.guard';
import { GoogleStrategy } from './strategies/google.strategy';
import { LinkedInStrategy } from './strategies/linkedin.strategy';
import { LinkedInAuthGuard } from './guards/linkedin-auth.guard';
import { EmailService } from '../common/services/email.service';
import { AuditLogModule } from '../common/audit-logs/audit-log.module';
import { PlatformSettingsModule } from '../platform-settings/platform-settings.module';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Role, RoleSchema } from '../users/roles/schemas/role.schema';
import { Student, StudentSchema } from '../students/schemas/student.schema';
import { Company, CompanySchema } from '../companies/schemas/company.schema';
import { University, UniversitySchema } from '../universities/schemas/university.schema';
import { AuditLog, AuditLogSchema } from '../common/audit-logs/schemas/audit-log.schema';
import { CollegeCoordinator, CollegeCoordinatorSchema } from '../universities/college-coordinators/schemas/college-coordinator.schema';
import { College, CollegeSchema } from '../universities/colleges/schemas/college.schema';
import { Department, DepartmentSchema } from '../universities/departments/schemas/department.schema';
import { StudentAffiliation, StudentAffiliationSchema } from '../universities/student-affiliations/schemas/student-affiliation.schema';
import { AcademicProgram, AcademicProgramSchema } from '../universities/academic-programs/schemas/academic-program.schema';

@Module({
  imports: [
    AuditLogModule,
    PlatformSettingsModule,
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Role.name, schema: RoleSchema },
      { name: Student.name, schema: StudentSchema },
      { name: Company.name, schema: CompanySchema },
      { name: University.name, schema: UniversitySchema },
      { name: AuditLog.name, schema: AuditLogSchema },
      { name: CollegeCoordinator.name, schema: CollegeCoordinatorSchema },
      { name: College.name, schema: CollegeSchema },
      { name: Department.name, schema: DepartmentSchema },
      { name: StudentAffiliation.name, schema: StudentAffiliationSchema },
      { name: AcademicProgram.name, schema: AcademicProgramSchema },
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '15m' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    EmailService,
    JwtAuthGuard,
    RolesGuard,
    PermissionsGuard,
    GoogleStrategy,
    LinkedInStrategy,
    LinkedInAuthGuard,
  ],
  exports: [AuthService, EmailService, JwtAuthGuard, RolesGuard, PermissionsGuard, JwtModule],
})
export class AuthModule {}
