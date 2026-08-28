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

// Payload sent when generating a new trip
export interface GenerateTripData {
  destination: string;
  days: number;
  budget: number;
  travel_style: string;
}

// ---------------------------------------------------------------------------
// Service functions
// ---------------------------------------------------------------------------

// GET /trips — fetch all trips
export async function getTrips(): Promise<Trip[]> {
  const res = await fetch(`${API_URL}/trips`);
  if (!res.ok) throw new Error(`Failed to fetch trips: ${res.status}`);
  return res.json();
}

// GET /trips/:id — fetch a single trip by ID
export async function getTrip(id: number): Promise<Trip> {
  const res = await fetch(`${API_URL}/trips/${id}`);
  if (!res.ok) throw new Error(`Failed to fetch trip ${id}: ${res.status}`);
  return res.json();
}

// POST /trips — generate a new AI trip
export async function generateTrip(data: GenerateTripData): Promise<Trip> {
  const res = await fetch(`${API_URL}/trips`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Failed to generate trip: ${res.status}`);
  return res.json();
}
