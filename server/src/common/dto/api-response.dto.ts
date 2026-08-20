export class ApiResponse<T = any> {
  success: boolean = true;
  message?: string;
  data?: T;
  error?: string;
  timestamp: string = new Date().toISOString();

  constructor(partial?: Partial<ApiResponse<T>>) {
    if (partial) {
      Object.assign(this, partial);
    }
  }

  static success<T>(data: T, message?: string): ApiResponse<T> {
    return new ApiResponse<T>({
      success: true,
      data,
      message,
    });
  }

  static error<T = any>(error: string, message?: string): ApiResponse<T> {
    return new ApiResponse<T>({
      success: false,
      error,
      message,
    });
  }
}
