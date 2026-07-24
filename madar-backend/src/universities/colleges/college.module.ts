import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { College, CollegeSchema } from './schemas/college.schema';
import { CollegeService } from './college.service';
import { CollegeController } from './college.controller';
import { AuthModule } from '../../auth/auth.module';

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([{ name: College.name, schema: CollegeSchema }]),
  ],
  controllers: [CollegeController],
  providers: [CollegeService],
  exports: [CollegeService],
})
export class CollegeModule {}
