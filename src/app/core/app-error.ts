export enum ErrorCode {
  NotFound = 'NOT_FOUND',
  Validation = 'VALIDATION',
  Network = 'NETWORK',
  Internal = 'INTERNAL',
  InvalidResponse = 'INVALID_RESPONSE'
}

const DEFAULT_MESSAGES: Record<ErrorCode, string> = {
  [ErrorCode.NotFound]: 'We could not find what you were looking for.',
  [ErrorCode.Validation]: 'Some of the submitted data was rejected.',
  [ErrorCode.Network]: 'Could not reach the server. Check your connection and try again.',
  [ErrorCode.Internal]: 'Something went wrong on our side. Please try again.',
  [ErrorCode.InvalidResponse]: 'The server sent a response we did not understand.'
};

export class AppError extends Error {
  constructor(
    readonly code: ErrorCode,
    message: string = DEFAULT_MESSAGES[code],
    readonly httpStatus?: number
  ) {
    super(message);
    this.name = 'AppError';
  }
}

/** Message to show a user for any thrown value. */
export function errorMessage(error: unknown): string {
  return error instanceof AppError ? error.message : DEFAULT_MESSAGES[ErrorCode.Internal];
}
