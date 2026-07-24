import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AiEmbedding, AiEmbeddingSchema } from './schemas/ai-embedding.schema';
import { AiEmbeddingService } from './ai-embedding.service';
import { AiEmbeddingController } from './ai-embedding.controller';
import { AuthModule } from '../../auth/auth.module';

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([{ name: AiEmbedding.name, schema: AiEmbeddingSchema }]),
  ],
  controllers: [AiEmbeddingController],
  providers: [AiEmbeddingService],
  exports: [AiEmbeddingService],
})
export class AiEmbeddingModule {}
