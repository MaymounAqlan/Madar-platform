import { Controller, Get, Post, Put, Delete, Patch, Body, Param, Query, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { NotificationService } from './notification.service';
import { Notification } from './schemas/notification.schema';
import { JwtAuthGuard } from '../../auth/auth.guard';

@Controller('api/notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(private readonly service: NotificationService) {}

  @Post()
  async create(@Body() data: Partial<Notification>, @Req() req: Request) {
    const userId = (req as any).user?.sub;
    if (!userId) {
      throw new Error('Authenticated user id is required');
    }
    return this.service.create({ ...data, userId });
  }

  @Get()
  async findAll(@Query() filter: any) {
    return this.service.findAll(filter);
  }

  @Get('mine')
  async findMine(@Req() req: Request, @Query() query: any) {
    const userId = (req as any).user?.sub;
    return this.service.findMine(userId, query);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: Partial<Notification>) {
    return this.service.update(id, data);
  }

  @Patch(':id/read')
  async markRead(@Param('id') id: string, @Req() req: Request) {
    const userId = (req as any).user?.sub;
    return this.service.markRead(id, userId);
  }

  @Post('mark-all-read')
  async markAllRead(@Req() req: Request) {
    const userId = (req as any).user?.sub;
    return this.service.markAllRead(userId);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.service.delete(id);
  }
}
