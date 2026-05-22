export interface SessionIdentityDto {
  userName: string;
  role: 'Admin';
  fullName: string;
}

export interface LoginRequest {
  user: string;
  password: string;
}
