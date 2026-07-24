import { Controller, Get, Post, Patch, Param, Body, UseGuards, Req, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { Request } from 'express';
import { AdminAiService } from './admin-ai.service';
import { UpdateModelSettingsDto } from './dto/update-model-settings.dto';
import { JwtAuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { RequirePermissions } from '../auth/permissions.decorator';
import { PermissionsGuard } from '../auth/permissions.guard';
import { UserRole } from '../common/enums/user-role.enum';
import { AdminPermission } from '../users/permissions/permission.registry';

@ApiTags('Admin AI Models')
@Controller('api/admin/ai-models')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@ApiBearerAuth()
export class AdminAiController {
  constructor(private readonly adminAiService: AdminAiService) {}

  private getAdminId(req: Request): string {
    return (req as any).user?.sub;
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @RequirePermissions(AdminPermission.AI_READ)
  @ApiOperation({ summary: 'Get all AI models with their status and metrics' })
  async getModels() {
    return this.adminAiService.getAIModels();
  }

  @Get('logs')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @RequirePermissions(AdminPermission.AI_READ)
  @ApiOperation({ summary: 'Get AI operations execution logs' })
  async getOperationLogs(@Query('modelId') modelId?: string) {
    return this.adminAiService.getOperationLogs(modelId);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @RequirePermissions(AdminPermission.AI_READ)
  @ApiOperation({ summary: 'Get details of a specific AI model' })
  async getModel(@Param('id') id: string) {
    return this.adminAiService.getAIModelById(id);
  }

  @Post(':id/train')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @RequirePermissions(AdminPermission.AI_WRITE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Trigger training/running for a model' })
  async trainModel(@Param('id') id: string, @Req() req: Request) {
    return this.adminAiService.triggerAction(this.getAdminId(req), id, 'train');
  }

  @Post(':id/reload')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @RequirePermissions(AdminPermission.AI_WRITE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Trigger model reload/refresh action' })
  async reloadModel(@Param('id') id: string, @Req() req: Request) {
    return this.adminAiService.triggerAction(this.getAdminId(req), id, 'reload');
  }

  @Post(':id/reindex')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @RequirePermissions(AdminPermission.AI_WRITE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Trigger embeddings reindex for a model' })
  async reindexModel(@Param('id') id: string, @Req() req: Request) {
    return this.adminAiService.triggerAction(this.getAdminId(req), id, 'reindex');
  }

  @Post(':id/recalculate')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @RequirePermissions(AdminPermission.AI_WRITE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Trigger matching score recalculation' })
  async recalculateModel(@Param('id') id: string, @Req() req: Request) {
    return this.adminAiService.triggerAction(this.getAdminId(req), id, 'recalculate');
  }

  @Post(':id/refresh-taxonomy')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @RequirePermissions(AdminPermission.AI_WRITE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Trigger skill taxonomy refresh' })
  async refreshTaxonomy(@Param('id') id: string, @Req() req: Request) {
    return this.adminAiService.triggerAction(this.getAdminId(req), id, 'refresh-taxonomy');
  }

  @Patch(':id/settings')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @RequirePermissions(AdminPermission.AI_WRITE)
  @ApiOperation({ summary: 'Update parameters and settings of an AI model' })
  async updateSettings(
    @Param('id') id: string,
    @Body() settingsDto: UpdateModelSettingsDto,
    @Req() req: Request
  ) {
    return this.adminAiService.updateSettings(this.getAdminId(req), id, settingsDto);
  }

  @Get(':id/status')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @RequirePermissions(AdminPermission.AI_READ)
  @ApiOperation({ summary: 'Get current operation status and progress of an AI model' })
  async getModelStatus(@Param('id') id: string) {
    return this.adminAiService.getModelStatus(id);
  }
}
