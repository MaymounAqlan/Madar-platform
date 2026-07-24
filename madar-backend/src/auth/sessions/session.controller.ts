import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { SessionService } from './session.service';
import { Session } from './schemas/session.schema';

@Controller('sessions')
export class SessionController {
  constructor(private readonly service: SessionService) {}

  @Post()
  async create(@Body() data: Partial<Session>) {
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
  async update(@Param('id') id: string, @Body() data: Partial<Session>) {
    return this.service.update(id, data);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.service.delete(id);
  }
}
