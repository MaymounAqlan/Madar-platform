import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { MarketDataService } from './market-data.service';
import { MarketData } from './schemas/market-data.schema';
import { JwtAuthGuard } from '../../auth/auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';

@Controller('marketdata')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MarketDataController {
  constructor(private readonly service: MarketDataService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async create(@Body() data: Partial<MarketData>) {
    return this.service.create(data);
  }

  @Get()
  async findAll(@Query() filter: any) {
    return this.service.findAll(filter);
  }

  @Get('trends/summary')
  async trends(@Query('months') months?: string) {
    return this.service.analyzeTrends(Number(months || 12));
  }

  @Post('trends/refresh')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async refreshTrends(@Query('months') months?: string) {
    return this.service.analyzeTrends(Number(months || 12));
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async update(@Param('id') id: string, @Body() data: Partial<MarketData>) {
    return this.service.update(id, data);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async delete(@Param('id') id: string) {
    return this.service.delete(id);
  }
}
