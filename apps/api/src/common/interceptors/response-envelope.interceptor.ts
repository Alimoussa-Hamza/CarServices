import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';

@Injectable()
export class ResponseEnvelopeInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const requestId = crypto.randomUUID();

    return next.handle().pipe(
      map((body) => {
        if (body && typeof body === 'object' && 'data' in body) {
          return {
            ...body,
            meta: { requestId, ...(body.meta as object) },
          };
        }

        return {
          data: body,
          meta: { requestId },
        };
      }),
    );
  }
}
