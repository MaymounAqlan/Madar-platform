import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  ContactRequest,
  ContactRequestSchema,
} from './schemas/contact-request.schema';
import { SupportController } from './support.controller';
import { SupportService } from './support.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ContactRequest.name, schema: ContactRequestSchema },
    ]),
  ],
  controllers: [SupportController],
  providers: [SupportService],
})
export class SupportModule {}
