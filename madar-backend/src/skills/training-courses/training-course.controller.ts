import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { TrainingCourseService } from './training-course.service';
import { TrainingCourse } from './schemas/training-course.schema';

@Controller('trainingcourses')
export class TrainingCourseController {
  constructor(private readonly service: TrainingCourseService) {}

  @Post()
  async create(@Body() data: Partial<TrainingCourse>) {
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
  async update(@Param('id') id: string, @Body() data: Partial<TrainingCourse>) {
    return this.service.update(id, data);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.service.delete(id);
  }
}
