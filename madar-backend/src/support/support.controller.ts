import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';
import { CreateContactRequestDto } from './dto/create-contact-request.dto';
import { SupportService } from './support.service';

@ApiTags('Support')
@Controller('api/support')
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Post('contact')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submit a public contact request' })
  @ApiCreatedResponse({ description: 'Contact request accepted' })
  createContactRequest(
    @Body() dto: CreateContactRequestDto,
    @Req() request: Request,
  ) {
    const forwarded = request.headers['x-forwarded-for'];
    const forwardedAddress = Array.isArray(forwarded)
      ? forwarded[0]
      : forwarded?.split(',')[0]?.trim();
    return this.supportService.createContactRequest(
      dto,
      forwardedAddress || request.ip || request.socket.remoteAddress || 'unknown',
    );
  }
}
