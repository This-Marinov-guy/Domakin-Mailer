export interface EmailReceiver {
  email: string;
  id?: string;
}

export interface RoomEmailData {
  room_link: string;
  room_image_src: string;
  room_title: string;
  room_rent: string | number;
  room_location: string;
  room_city: string;
  room_period: string;
  room_flatmates: string;
}

export interface BlogPost {
  thumbnail: string | null;
  title: string;
  url: string;
}

export interface EmailRemindersJobResult {
  processed: number;
  completed: number;
  failed: number;
  errors: { id: number; email: string; error: string }[];
}

export interface FinishApplicationJobResult {
  processed: number;
  sent: number;
  errors: { id: number; email: string; error: string }[];
}

export interface NewsletterRow {
  id: string | number;
  email: string;
  cities: string;
  language?: string;
  created_at?: string | null;
  year?: number | null;
}

export interface SearchRentingRow {
  id: string | number;
  email: string;
  city: string;
}
