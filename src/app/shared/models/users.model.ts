export interface UserResponse {
  id: number | string;
  name: string;
  email: string;
  profileName: string;
  profile: string;
  active: boolean;
}

export interface UserCreateRequest {
  name: string;
  email: string;
  password: string;
  profileName: string;
  enabled: boolean;
}

export interface UserUpdateRequest {
  name: string;
  email: string;
  profileName: string;
  enabled: boolean;
  password?: string;
}

export interface UserPageResponse {
  content: UserResponse[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}
