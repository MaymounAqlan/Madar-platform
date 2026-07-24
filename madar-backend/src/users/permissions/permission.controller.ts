import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { PermissionService } from './permission.service';
import { Permission } from './schemas/permission.schema';

@Controller('permissions')
export class PermissionController {
  constructor(private readonly service: PermissionService) {}

  @Post()
  async create(@Body() data: Partial<Permission>) {
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
  async update(@Param('id') id: string, @Body() data: Partial<Permission>) {
    return this.service.update(id, data);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.service.delete(id);
  }
}
