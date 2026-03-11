export interface BoxImage {
  name: string;
  type: string;
  size: number;
  base_url: string;
  path: string;
  url: string;
  delete_url: string;
}

export interface BoxThumbnail {
  small: string;
  big: string;
}

export interface Box {
  id: string;
  number: number;
  location: [string, string]; // [lat, lng]
  thumbnails: BoxThumbnail[];
  is_empty: boolean;
  created_at: number;
}

export interface VerifyResponse {
  hash: string;
  expires_in?: number;
}
