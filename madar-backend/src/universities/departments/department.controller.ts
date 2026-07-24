import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { DepartmentService } from './department.service';
import { Department } from './schemas/department.schema';
import { JwtAuthGuard } from '../../auth/auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';

@Controller('departments')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.UNIVERSITY, UserRole.COORDINATOR, UserRole.ADMIN, UserRole.SUPER_ADMIN)
export class DepartmentController {
  constructor(private readonly service: DepartmentService) {}

  @Post()
  async create(@Body() data: Partial<Department>) {
    return this.service.create(data);
  }

  @Get()
  async findAll(@Query() filter: any) {
    return this.service.findAll(filter);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: Partial<Department>) {
    return this.service.update(id, data);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.service.delete(id);
  }
}
