// ---------------------------------------------------------------------------
// URL helper
// Strips any trailing slash from NEXT_PUBLIC_API_URL so callers can safely
// append paths starting with "/" without creating double slashes (//).
//
// Supports both:
//   NEXT_PUBLIC_API_URL=http://localhost:8000          → base only
//   NEXT_PUBLIC_API_URL=http://localhost:8000/         → trailing slash stripped
// ---------------------------------------------------------------------------

export function getCleanApiUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
  return raw.replace(/\/+$/, ""); // remove one or more trailing slashes
}

const BASE_URL = getCleanApiUrl();

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface LoginResponse {
  access_token: string;
  token_type:   string;
}

export interface RegisterResponse {
  id:    number;
  name:  string;
  email: string;
}

export interface UserProfile {
  id:    number;
  name:  string;
  email: string;
}

// ---------------------------------------------------------------------------
// Token helpers — single source of truth for the localStorage "token" key
// ---------------------------------------------------------------------------

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

export function saveToken(token: string): void {
  localStorage.setItem("token", token);
}

export function removeToken(): void {
  localStorage.removeItem("token");
}

// ---------------------------------------------------------------------------
// Auth header helper — attach to any authenticated fetch call
// ---------------------------------------------------------------------------

export function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ---------------------------------------------------------------------------
// login(email, password)
// POST /api/v1/auth/login
// ---------------------------------------------------------------------------

export async function login(email: string, password: string): Promise<LoginResponse> {
  const res = await fetch(`${BASE_URL}/api/v1/auth/login`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ email, password }),
  });

  if (res.status === 401) {
    throw new Error("Invalid email or password. Please check your credentials.");
  }

  if (!res.ok) {
    throw new Error(`Login failed (${res.status}). Please try again.`);
  }

  return res.json() as Promise<LoginResponse>;
}

// ---------------------------------------------------------------------------
// register(name, email, password)
// POST /api/v1/auth/register
// ---------------------------------------------------------------------------

export async function register(
  name:     string,
  email:    string,
  password: string,
): Promise<RegisterResponse> {
  const res = await fetch(`${BASE_URL}/api/v1/auth/register`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ name, email, password }),
  });

  if (res.status === 409) {
    throw new Error("This email is already registered. Try logging in instead.");
  }

  if (!res.ok) {
    throw new Error(`Registration failed (${res.status}). Please try again.`);
  }

  return res.json() as Promise<RegisterResponse>;
}

// ---------------------------------------------------------------------------
// getProfile(token)
// GET /api/v1/auth/me
// Identity is derived from the JWT — no user_id in the URL.
// ---------------------------------------------------------------------------

export async function getProfile(token: string): Promise<UserProfile> {
  const res = await fetch(`${BASE_URL}/api/v1/auth/me`, {
    headers: {
      "Content-Type":  "application/json",
      "Authorization": `Bearer ${token}`,
    },
  });

  if (res.status === 401) {
    throw new Error("Session expired. Please log in again.");
  }

  if (!res.ok) {
    throw new Error(`Failed to load profile (${res.status}). Please try again.`);
  }

  return res.json() as Promise<UserProfile>;
}
