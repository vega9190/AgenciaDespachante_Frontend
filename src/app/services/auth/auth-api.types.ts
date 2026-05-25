export interface LoginApiRequest {
  username: string;
  password: string;
}

export interface LoginResponseDto {
  accessToken: string;
  expiresAtUtc: string;
  username: string;
  firstName: string;
  lastName: string;
  role: string;
}
