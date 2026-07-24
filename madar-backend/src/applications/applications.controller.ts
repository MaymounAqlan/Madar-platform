import {
  Controller,
  Get,
  Put,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ApplicationsService } from './applications.service';
import { UpdateApplicationDto } from './dto/update-application.dto';
import { JwtAuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';

@ApiTags('Applications')
@Controller('api/applications')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.COMPANY)
  @ApiOperation({ summary: 'List all applications' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'jobId', required: false })
  @ApiQuery({ name: 'studentId', required: false })
  @ApiQuery({ name: 'companyId', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiResponse({ status: 200, description: 'List of applications' })
  async findAll(@Query() query: any) {
    return this.applicationsService.findAll(query);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.COMPANY, UserRole.STUDENT)
  @ApiOperation({ summary: 'Get application by ID' })
  @ApiResponse({ status: 200, description: 'Application details' })
  async findById(@Param('id') id: string) {
    return this.applicationsService.findById(id);
  }

  @Put(':id')
  @Roles(UserRole.COMPANY, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update application status' })
  @ApiResponse({ status: 200, description: 'Application updated' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateApplicationDto,
    @Req() req: Request,
  ) {
    const userId = (req as any).user?.sub;
    return this.applicationsService.update(id, dto, userId);
  }
}
