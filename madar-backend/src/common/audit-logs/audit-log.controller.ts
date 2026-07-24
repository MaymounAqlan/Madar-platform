import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { AuditLogService } from './audit-log.service';
import { AuditLog } from './schemas/audit-log.schema';

@Controller('auditlogs')
export class AuditLogController {
  constructor(private readonly service: AuditLogService) {}

  @Post()
  async create(@Body() data: Partial<AuditLog>) {
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
  async update(@Param('id') id: string, @Body() data: Partial<AuditLog>) {
    return this.service.update(id, data);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.service.delete(id);
  }
}
