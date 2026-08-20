export class ApiResponseDto<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: unknown[];

  static ok<T>(data: T, message = 'Success'): ApiResponseDto<T> {
    return { success: true, data, message };
  }

  static fail(message: string, errors: unknown[] = []): ApiResponseDto<never> {
    return { success: false, message, errors };
  }
}
