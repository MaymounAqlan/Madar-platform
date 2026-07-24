import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  ForbiddenException,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AuditLog, AuditLogDocument } from '../audit-logs/schemas/audit-log.schema';

/**
 * Logs security-relevant exceptions to the audit log.
 * Applied globally or to the Admin controller.
 */
@Catch(ForbiddenException, UnauthorizedException)
export class AdminSecurityExceptionFilter implements ExceptionFilter {
  constructor(
    @InjectModel(AuditLog.name) private readonly auditLogModel: Model<AuditLogDocument>,
  ) {}

  catch(exception: ForbiddenException | UnauthorizedException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();
    const status = exception instanceof ForbiddenException ? 403 : 401;
    const user = (request as any).user;

    try {
      const action = status === 403 ? 'FORBIDDEN' : 'UNAUTHORIZED_ACCESS';
      const isPrivilegeEscalation =
        status === 403 &&
        request.body &&
        (request.body.role === 'super_admin' ||
          request.body.userType === 'super_admin' ||
          request.body.roleId === 'super_admin');

      this.auditLogModel.create({
        actorId: user?.sub ? new Types.ObjectId(user.sub) : undefined,
        action: isPrivilegeEscalation ? 'PRIVILEGE_ESCALATION_ATTEMPT' : action,
        resource: request.route?.path || request.path,
        resourceId: request.params?.id || 'n/a',
        details: {
          method: request.method,
          path: request.path,
          role: user?.role,
          bodyKeys: Object.keys(request.body || {}),
          message: exception.message,
        },
        severity: isPrivilegeEscalation ? 'critical' : status === 403 ? 'warning' : 'info',
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'],
        timestamp: new Date(),
      });
    } catch (logError: any) {
      // Never throw from audit logging
    }

    response.status(status).json({
      success: false,
      statusCode: status,
      message: exception.message,
    });
  }
}
