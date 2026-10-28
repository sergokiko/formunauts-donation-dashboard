import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom, Observable } from 'rxjs';
import { z } from 'zod';
import { AppError, ErrorCode } from '../core/app-error';
import { ApiErrorSchema } from './schemas/api-error-schema';

export async function requestJson<T>(source: Observable<unknown>, schema: z.ZodType<T>): Promise<T> {
  try {
    return schema.parse(await firstValueFrom(source));
  } catch (error) {
    throw toAppError(error);
  }
}

export function toAppError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }
  if (error instanceof HttpErrorResponse) {
    const body = ApiErrorSchema.safeParse(error.error);
    const serverMessage = body.success ? body.data.message : undefined;
    switch (true) {
      case error.status === 0:
        return new AppError(ErrorCode.Network, undefined, 0);
      case error.status === 404:
        return new AppError(ErrorCode.NotFound, serverMessage, 404);
      case error.status === 400 || error.status === 422:
        return new AppError(ErrorCode.Validation, serverMessage, error.status);
      default:
        return new AppError(ErrorCode.Internal, undefined, error.status);
    }
  }
  if (error instanceof z.ZodError) {
    return new AppError(ErrorCode.InvalidResponse);
  }
  return new AppError(ErrorCode.Internal);
}
