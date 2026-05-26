export interface MessageResult {
  description: string;
  type: number;
}

export enum MessageLevelType {
  Info = 1,
  Warning = 2,
  Success = 3,
  Error = 4
}

export interface ApiResult {
  isValid: boolean;
  messageList: MessageResult[];
}

export interface ApiResultOf<T> extends ApiResult {
  data: T | null;
}
