import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { SkillsService } from './skills.service';
import { CreateSkillDto } from './dto/create-skill.dto';
import { JwtAuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';

@ApiTags('Skills')
@Controller('api/skills')
export class SkillsController {
  constructor(private readonly skillsService: SkillsService) {}

  @Get()
  @ApiOperation({ summary: 'List skills (public)' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'category', required: false, enum: ['technical', 'soft', 'language', 'domain'] })
  @ApiQuery({ name: 'search', required: false })
  @ApiResponse({ status: 200, description: 'List of skills' })
  async findAll(@Query() query: any) {
    return this.skillsService.findAll(query);
  }

  @Get('trending')
  @ApiOperation({ summary: 'Get trending skills' })
  @ApiResponse({ status: 200, description: 'Trending skills' })
  async getTrending(@Query('limit') limit: number) {
    return this.skillsService.getTrending(limit || 10);
  }

  @Get('category/:category')
  @ApiOperation({ summary: 'Get skills by category' })
  @ApiResponse({ status: 200, description: 'Skills by category' })
  async getByCategory(@Param('category') category: string) {
    return this.skillsService.getByCategory(category);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get skill by ID' })
  @ApiResponse({ status: 200, description: 'Skill details' })
  async findById(@Param('id') id: string) {
    return this.skillsService.findById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new skill (admin only)' })
  @ApiResponse({ status: 201, description: 'Skill created' })
  async create(@Body() dto: CreateSkillDto) {
    return this.skillsService.create(dto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update skill (admin only)' })
  @ApiResponse({ status: 200, description: 'Skill updated' })
  async update(@Param('id') id: string, @Body() dto: Partial<CreateSkillDto>) {
    return this.skillsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete skill (admin only)' })
  @ApiResponse({ status: 200, description: 'Skill deleted' })
  async remove(@Param('id') id: string) {
    await this.skillsService.remove(id);
    return { message: 'Skill deleted successfully' };
  }
}
