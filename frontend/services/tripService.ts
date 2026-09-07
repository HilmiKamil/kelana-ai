import { getCleanApiUrl } from "@/services/authService";

// Re-use the same URL helper so both services always point to the same base.
const BASE_URL = getCleanApiUrl();

// ---------------------------------------------------------------------------
// Types — mirror the backend Trip model
// ---------------------------------------------------------------------------

export interface Trip {
  id:               number;
  destination:      string;
  days:             number;
  budget:           number;
  category:         string;
  daily_budget:     number;
  travel_style:     string | null;
  ai_recommendation: string | null;
  created_at:       string;
}

export interface GenerateTripData {
  destination:  string;
  days:         number;
  budget:       number;
  travel_style: string;
}

// ---------------------------------------------------------------------------
// Service functions
// Each function accepts token as an explicit argument — no localStorage here.
// ---------------------------------------------------------------------------

// GET /api/v1/trips — fetch all trips for the authenticated user
export async function getTrips(token: string): Promise<Trip[]> {
  const res = await fetch(`${BASE_URL}/api/v1/trips`, {
    headers: {
      "Content-Type":  "application/json",
      "Authorization": `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error(`Failed to fetch trips (${res.status}).`);
  return res.json();
}

// GET /api/v1/trips/:id — fetch a single trip by ID
export async function getTrip(id: number, token: string): Promise<Trip> {
  const res = await fetch(`${BASE_URL}/api/v1/trips/${id}`, {
    headers: {
      "Content-Type":  "application/json",
      "Authorization": `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error(`Failed to fetch trip ${id} (${res.status}).`);
  return res.json();
}

// POST /api/v1/trips — generate a new AI trip
export async function generateTrip(data: GenerateTripData, token: string): Promise<Trip> {
  const res = await fetch(`${BASE_URL}/api/v1/trips`, {
    method:  "POST",
    headers: {
      "Content-Type":  "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Failed to generate trip (${res.status}).`);
  return res.json();
}
