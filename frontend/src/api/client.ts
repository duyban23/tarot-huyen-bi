import type {
  AiFullResult,
  AiReadingResult,
  AiService,
  Booking,
  BookingCreatePayload,
  ContactMessage,
  ContactMessagePayload,
  IdolApplication,
  IdolApplicationPayload,
  PaymentOrder,
  PaymentStatus,
  Service,
  TokenResponse,
} from "./types";

const BASE = import.meta.env.VITE_API_BASE || "";

/** Thrown when an admin API call gets a 401. Components catch and redirect via React Router. */
export class UnauthorizedError extends Error {
  constructor() {
    super("Unauthorized");
    this.name = "UnauthorizedError";
  }
}

/** Non-2xx API response with the HTTP status kept for UI decisions. */
export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

let _onUnauthorized: (() => void) | null = null;

/** Register a callback that navigates to /admin/login on 401. Call from a React effect. */
export function setOnUnauthorized(cb: () => void) {
  _onUnauthorized = cb;
}

export function clearOnUnauthorized() {
  _onUnauthorized = null;
}

async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options?.headers as Record<string, string>) },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }));
    // 401 on admin endpoints → invoke callback instead of window.location.href
    if (res.status === 401 && _onUnauthorized) {
      localStorage.removeItem("admin_token");
      _onUnauthorized();
      throw new UnauthorizedError();
    }
    throw new ApiError(body.detail || `HTTP ${res.status}`, res.status);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

function authHeader(): Record<string, string> {
  const token = localStorage.getItem("admin_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// Public
export function getServices() {
  return api<Service[]>("/api/services");
}

export function getAvailability(service_id: number, date: string) {
  return api<string[]>(
    `/api/bookings/availability?service_id=${service_id}&date_str=${encodeURIComponent(date)}`
  );
}

export function createBooking(data: BookingCreatePayload) {
  return api<Booking>("/api/bookings", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function createIdolApplication(data: IdolApplicationPayload) {
  return api<IdolApplication>("/api/recruit", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function createContactMessage(data: ContactMessagePayload) {
  return api<ContactMessage>("/api/contact", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// AI xem cùng My
export function getAiServices() {
  return api<AiService[]>("/api/ai/services");
}

export function createAiReading(
  service: string,
  input: Record<string, unknown>,
  signal?: AbortSignal
) {
  return api<AiReadingResult>("/api/ai/reading", {
    method: "POST",
    body: JSON.stringify({ service, input }),
    signal,
  });
}

export function createAiFull(
  service: string,
  input: Record<string, unknown>,
  payment_code: string,
  signal?: AbortSignal
) {
  return api<AiFullResult>("/api/ai/reading/full", {
    method: "POST",
    body: JSON.stringify({ service, input, payment_code }),
    signal,
  });
}

// SePay
export function createPayment(service: string, input: Record<string, unknown>) {
  return api<PaymentOrder>("/api/payments", {
    method: "POST",
    body: JSON.stringify({ service, input }),
  });
}

export function getPaymentStatus(code: string) {
  return api<PaymentStatus>(`/api/payments/${encodeURIComponent(code)}`);
}

// Auth
export function adminLogin(username: string, password: string) {
  return api<TokenResponse>("/api/admin/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

// Admin bookings (401 handled by api() via _onUnauthorized callback)
export function getAdminBookings(status?: string, date?: string) {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (date) params.set("date", date);
  const qs = params.toString();
  return api<Booking[]>(`/api/admin/bookings${qs ? "?" + qs : ""}`, {
    headers: authHeader(),
  });
}

export function updateBookingStatus(id: number, status: string) {
  return api<Booking>(`/api/admin/bookings/${id}`, {
    method: "PATCH",
    headers: authHeader(),
    body: JSON.stringify({ status }),
  });
}

export function deleteBooking(id: number) {
  return api<void>(`/api/admin/bookings/${id}`, {
    method: "DELETE",
    headers: authHeader(),
  });
}

// Admin services
export function getAdminServices() {
  return api<Service[]>("/api/admin/services", {
    headers: authHeader(),
  });
}

export function createAdminService(data: Partial<Service>) {
  return api<Service>("/api/admin/services", {
    method: "POST",
    headers: authHeader(),
    body: JSON.stringify(data),
  });
}

export function updateAdminService(id: number, data: Partial<Service>) {
  return api<Service>(`/api/admin/services/${id}`, {
    method: "PUT",
    headers: authHeader(),
    body: JSON.stringify(data),
  });
}

export function deleteAdminService(id: number) {
  return api<void>(`/api/admin/services/${id}`, {
    method: "DELETE",
    headers: authHeader(),
  });
}

// Admin AI & payments
export interface AdminPayment {
  id: number;
  code: string;
  service_type: string;
  amount: number;
  status: string;
  sepay_tx_id: string | null;
  created_at: string;
  paid_at: string | null;
}

export interface AdminReading {
  id: number;
  service_type: string;
  input_json: string;
  has_full: boolean;
  payment_id: number | null;
  created_at: string;
}

export function getAdminPayments(status?: string) {
  const qs = status ? `?status=${encodeURIComponent(status)}` : "";
  return api<AdminPayment[]>(`/api/admin/payments${qs}`, {
    headers: authHeader(),
  });
}

export function getAdminReadings() {
  return api<AdminReading[]>("/api/admin/readings", {
    headers: authHeader(),
  });
}

// Admin idol applications
export function getAdminApplications(status?: string) {
  const qs = status ? `?status=${encodeURIComponent(status)}` : "";
  return api<IdolApplication[]>(`/api/admin/applications${qs}`, {
    headers: authHeader(),
  });
}

export function updateApplicationStatus(id: number, status: string) {
  return api<IdolApplication>(`/api/admin/applications/${id}`, {
    method: "PATCH",
    headers: authHeader(),
    body: JSON.stringify({ status }),
  });
}

export function deleteApplication(id: number) {
  return api<void>(`/api/admin/applications/${id}`, {
    method: "DELETE",
    headers: authHeader(),
  });
}

// Admin contact messages
export function getAdminMessages(unreadOnly?: boolean) {
  const qs = unreadOnly ? "?unread_only=true" : "";
  return api<ContactMessage[]>(`/api/admin/messages${qs}`, {
    headers: authHeader(),
  });
}

export function markMessageRead(id: number) {
  return api<ContactMessage>(`/api/admin/messages/${id}`, {
    method: "PATCH",
    headers: authHeader(),
  });
}

export function deleteMessage(id: number) {
  return api<void>(`/api/admin/messages/${id}`, {
    method: "DELETE",
    headers: authHeader(),
  });
}
