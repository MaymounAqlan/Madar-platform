import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { AnalyticsSnapshotService } from './analytics-snapshot.service';
import { AnalyticsSnapshot } from './schemas/analytics-snapshot.schema';

@Controller('analyticssnapshots')
export class AnalyticsSnapshotController {
  constructor(private readonly service: AnalyticsSnapshotService) {}

  @Post()
  async create(@Body() data: Partial<AnalyticsSnapshot>) {
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
  async update(@Param('id') id: string, @Body() data: Partial<AnalyticsSnapshot>) {
    return this.service.update(id, data);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.service.delete(id);
  }
}
