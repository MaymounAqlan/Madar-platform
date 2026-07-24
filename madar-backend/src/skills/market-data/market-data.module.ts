import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MarketData, MarketDataSchema } from './schemas/market-data.schema';
import { MarketDataService } from './market-data.service';
import { MarketDataController } from './market-data.controller';
import { Job, JobSchema } from '../../jobs/schemas/job.schema';
import { AuthModule } from '../../auth/auth.module';

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([
      { name: MarketData.name, schema: MarketDataSchema },
      { name: Job.name, schema: JobSchema },
    ]),
  ],
  controllers: [MarketDataController],
  providers: [MarketDataService],
  exports: [MarketDataService],
})
export class MarketDataModule {}
