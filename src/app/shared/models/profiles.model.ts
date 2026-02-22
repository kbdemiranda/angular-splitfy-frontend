export interface ProfileResponse {
  id: number | string;
  name: string;
}

export interface ProfileCreateRequest {
  name: string;
}

export interface ProfileUpdateRequest {
  name: string;
}
