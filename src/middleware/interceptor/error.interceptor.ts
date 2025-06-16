import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { catchError } from 'rxjs/operators';
import { Observable, throwError } from 'rxjs';
import { HttpException, Logger } from '@nestjs/common';

@Injectable()
export class ErrorInterceptor implements NestInterceptor {
  private readonly logger = new Logger(ErrorInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError((err) => {
        // Log the error
        this.logger.error('Error intercepted:', err);

        if (err instanceof HttpException) {
          return throwError(() => err);
        }

        return throwError(() => new HttpException('An unexpected error occurred', 500));
      }),
    );
  }
}