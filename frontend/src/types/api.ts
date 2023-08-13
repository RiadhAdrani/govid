export interface ApiResponse<T = undefined> {
  data: T | undefined;
  error?: string;
  msg?: string;
}
