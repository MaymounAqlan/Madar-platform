import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { MatchResultService } from './match-result.service';
import { MatchResult } from './schemas/match-result.schema';

@Controller('matchresults')
export class MatchResultController {
  constructor(private readonly service: MatchResultService) {}

  @Post()
  async create(@Body() data: Partial<MatchResult>) {
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
  async update(@Param('id') id: string, @Body() data: Partial<MatchResult>) {
    return this.service.update(id, data);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.service.delete(id);
  }
}
