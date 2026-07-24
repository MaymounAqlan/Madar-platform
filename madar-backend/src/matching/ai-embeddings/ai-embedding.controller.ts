import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AiEmbeddingService } from './ai-embedding.service';
import { AiEmbedding } from './schemas/ai-embedding.schema';
import { JwtAuthGuard } from '../../auth/auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { SearchAiEmbeddingDto, UpsertAiEmbeddingDto } from './dto/ai-embedding.dto';

@Controller('aiembeddings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
export class AiEmbeddingController {
  constructor(private readonly service: AiEmbeddingService) {}

  @Post()
  async create(@Body() data: Partial<AiEmbedding>) {
    return this.service.create(data);
  }

  @Post('upsert')
  async upsert(@Body() data: UpsertAiEmbeddingDto) {
    return this.service.upsert(data as any);
  }

  @Post('search')
  async search(@Body() data: SearchAiEmbeddingDto) {
    return this.service.search(data.vector, data.entityType, data.limit, data.model, data.modelVersion);
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
  async update(@Param('id') id: string, @Body() data: Partial<AiEmbedding>) {
    return this.service.update(id, data);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.service.delete(id);
  }
}
