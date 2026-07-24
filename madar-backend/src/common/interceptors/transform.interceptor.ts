import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  meta?: Record<string, any>;
  timestamp: string;
}

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, Response<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    const statusCode = context.switchToHttp().getResponse().statusCode;
    const request = context.switchToHttp().getRequest();

    return next.handle().pipe(
      map((result) => {
        if (result && typeof result === 'object' && 'data' in result) {
          const { data, ...meta } = result;
          return {
            success: true,
            statusCode,
            message: 'Success',
            data,
            meta,
            timestamp: new Date().toISOString(),
          };
        }
        return {
          success: true,
          statusCode,
          message: 'Success',
          data: result,
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }
}
