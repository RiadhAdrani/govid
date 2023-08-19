export type ApiResponse<Data = undefined, More extends object = {}> = {
  data: Data | undefined;
  error?: string;
  msg?: string;
} & More;
