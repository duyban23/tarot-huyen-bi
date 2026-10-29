export interface Service {
  id: number;
  name: string;
  description: string;
  duration_minutes: number;
  price: number;
  is_active: boolean;
}

export type MeetingMethod = "online" | "offline";

export interface Booking {
  id: number;
  service_id: number;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  appointment_date: string;
  appointment_time: string;
  status: "pending" | "confirmed" | "cancelled";
  meeting_method: MeetingMethod;
  note: string | null;
  created_at: string;
}

export interface BookingCreatePayload {
  service_id: number;
  date: string;
  time: string;
  meeting_method: MeetingMethod;
  customer_name: string;
  customer_phone: string;
  customer_email?: string | null;
  note?: string | null;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface IdolApplication {
  id: number;
  full_name: string;
  phone: string;
  email: string | null;
  social_link: string | null;
  reason: string;
  experience: string | null;
  status: "pending" | "contacted" | "accepted" | "rejected";
  note: string | null;
  created_at: string;
}

export interface IdolApplicationPayload {
  full_name: string;
  phone: string;
  email?: string | null;
  social_link?: string | null;
  reason: string;
  experience?: string | null;
}

export interface ContactMessage {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface ContactMessagePayload {
  name: string;
  email: string;
  phone?: string | null;
  message: string;
}
