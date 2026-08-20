import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiResponseDto } from '../dto/api-response.dto';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const isHttpException = exception instanceof HttpException;
    const status = isHttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const body = isHttpException ? exception.getResponse() : null;
    const message = isHttpException
      ? typeof body === 'string'
        ? body
        : ((body as { message?: string | string[] })?.message ??
          exception.message)
      : 'Internal server error';
    const errors = isHttpException
      ? Array.isArray((body as { message?: string[] })?.message)
        ? (body as { message: string[] }).message
        : []
      : [];

    if (!isHttpException) {
      this.logger.error(exception);
    }

    response
      .status(status)
      .json(
        ApiResponseDto.fail(
          Array.isArray(message) ? 'Validation failed' : message,
          errors,
        ),
      );
  }
}
