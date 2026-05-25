export interface SessionIdentityDto {
  accessToken: string;
  expiresAtUtc: string;
  userName: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: string;
  initials: string;
}

export interface LoginRequest {
  user: string;
  password: string;
}
