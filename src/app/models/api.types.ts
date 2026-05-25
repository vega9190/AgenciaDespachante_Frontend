export interface MessageResult {
  description: string;
  type: number;
}

export interface ApiResult {
  isValid: boolean;
  messageList: MessageResult[];
}

export interface ApiResultOf<T> extends ApiResult {
  data: T | null;
}
