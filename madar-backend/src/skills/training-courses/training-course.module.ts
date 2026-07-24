import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TrainingCourse, TrainingCourseSchema } from './schemas/training-course.schema';
import { TrainingCourseService } from './training-course.service';
import { TrainingCourseController } from './training-course.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: TrainingCourse.name, schema: TrainingCourseSchema }]),
  ],
  controllers: [TrainingCourseController],
  providers: [TrainingCourseService],
  exports: [TrainingCourseService],
})
export class TrainingCourseModule {}
