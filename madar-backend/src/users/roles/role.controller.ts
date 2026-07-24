import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { RoleService } from './role.service';
import { Role } from './schemas/role.schema';

@Controller('roles')
export class RoleController {
  constructor(private readonly service: RoleService) {}

  @Post()
  async create(@Body() data: Partial<Role>) {
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
  async update(@Param('id') id: string, @Body() data: Partial<Role>) {
    return this.service.update(id, data);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.service.delete(id);
  }
}
