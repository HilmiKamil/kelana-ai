// Base URL already includes /api/v1 — e.g. http://localhost:8000/api/v1
const API_URL = process.env.NEXT_PUBLIC_API_URL;

// ---------------------------------------------------------------------------
// Types — mirror the backend Trip model
// ---------------------------------------------------------------------------

export interface Trip {
  id: number;
  destination: string;
  days: number;
  budget: number;
  category: string;
  daily_budget: number;
  travel_style: string | null;
  ai_recommendation: string | null;
  created_at: string;
}

export interface GenerateTripData {
  destination: string;
  days: number;
  budget: number;
  travel_style: string;
}

// ---------------------------------------------------------------------------
// Service functions
// Each function accepts token as an explicit argument so this file
// stays free of browser-only APIs (localStorage, window).
// ---------------------------------------------------------------------------

// GET /trips — fetch all trips for the authenticated user
export async function getTrips(token: string): Promise<Trip[]> {
  const res = await fetch(`${API_URL}/trips`, {
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error(`Failed to fetch trips: ${res.status}`);
  return res.json();
}

// GET /trips/:id — fetch a single trip by ID
export async function getTrip(id: number, token: string): Promise<Trip> {
  const res = await fetch(`${API_URL}/trips/${id}`, {
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error(`Failed to fetch trip ${id}: ${res.status}`);
  return res.json();
}

// POST /trips — generate a new AI trip
export async function generateTrip(data: GenerateTripData, token: string): Promise<Trip> {
  const res = await fetch(`${API_URL}/trips`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Failed to generate trip: ${res.status}`);
  return res.json();
}
