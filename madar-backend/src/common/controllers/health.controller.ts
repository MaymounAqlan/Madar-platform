import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@ApiTags('Health')
@Controller('api/health')
export class HealthController {
  constructor(
    @InjectConnection() private readonly connection: Connection,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Public health check endpoint' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  async check() {
    let dbStatus = 'unknown';
    try {
      if (this.connection.readyState === 1) {
        dbStatus = 'connected';
      } else {
        dbStatus = 'disconnected';
      }
    } catch {
      dbStatus = 'error';
    }

    return {
      status: dbStatus === 'connected' ? 'healthy' : 'unhealthy',
      service: 'madar-api',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      checks: {
        database: dbStatus,
      },
    };
  }
}
