export interface ApiError {
  error: string;
}

export interface ApiData<T = unknown> {
  data: T;
}
