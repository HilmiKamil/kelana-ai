from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from services.trip_service import (
    calculate_daily_budget,
    get_trip_category,
    get_transportation_recommendation
)
from services.bedrock_service import get_ai_recommendations
from models.trip import Trip

from database import init_db, SessionLocal

class TripRequest(BaseModel):
    destination: str
    days: int
    budget: float
    travel_style: str

class TripUpdate(BaseModel):
    budget: float

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Mengizinkan semua domain (termasuk localhost:3000)
    allow_credentials=True,
    allow_methods=["*"],  # Mengizinkan POST, GET, dll
    allow_headers=["*"],
)

init_db()

# a Get endpoint at the root path

@app.get("/")
def home():
    return {
        "message"  : "Welcome to KelanaAI"
    }

@app.get("/health")
def home():
    return {
        "status"  : "OK"
    }

@app.get("/trip_categories")
def home():
    return ["Backpacker", "Standard", "Luxury"]

@app.get("/recommendations")
def home():
    return ["Tokyo Tower", "Mount Fuji", "Shibuya"]

@app.get("/transportations")
def home():
    return ["Bus", "Train", "Flight"]

@app.get("/api/v1/trips")
def list_trips():
    db = SessionLocal()
    trips = db.query(Trip).all()
    db.close()
    return trips

@app.get("/api/v1/trips/{trip_id}")
def get_trip(trip_id: int):
    db = SessionLocal()
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    db.close()
    if trip is None:
        raise HTTPException(status_code=404, detail=f"Trip with id {trip_id} not found")
    return trip

@app.post("/api/v1/trips/{trip_id}/generate")
def generate_ai_recommendation(trip_id: int):
    db = SessionLocal()
    trip = db.query(Trip).filter(Trip.id == trip_id).first()

    if trip is None:
        db.close()
        raise HTTPException(
            status_code=404,
            detail=f"Trip with id {trip_id} not found"
        )

    ai_recommendation = get_ai_recommendations(
        destination=trip.destination,
        days=trip.days,
        budget=trip.budget,
        travel_style=trip.category,
    )

    trip.ai_recommendation = ai_recommendation

    db.commit()
    db.refresh(trip)
    db.close()
    return trip

@app.post("/api/v1/trips")
def create_trip(request: TripRequest):
    daily_budget = calculate_daily_budget(
        request.budget, request.days
    )
    category = get_trip_category(
        request.budget
    )
    ai_recommendation = get_ai_recommendations(
        destination = request.destination,
        days = request.days,
        budget = request.budget,
        travel_style = request.travel_style,
    )
    trip = Trip(
        destination = request.destination,
        days = request.days,
        budget = request.budget,
        category = category,
        daily_budget = daily_budget,
        ai_recommendation = ai_recommendation,
    )

    db = SessionLocal()
    db.add(trip)
    db.commit()
    db.refresh(trip)
    db.close()
    return trip

@app.delete("/api/v1/trips/{trip_id}")
def delete_trip(trip_id: int):
    db = SessionLocal()
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    
    if trip is None:
        db.close()
        raise HTTPException(status_code=404, detail=f"Trip with id {trip_id} not found")
        
    db.delete(trip)
    db.commit()
    db.close()
    return {"message": f"Trip with id {trip_id} has been deleted successfully"}

@app.put("/api/v1/trips/{trip_id}")
def update_trip(trip_id: int, request: TripUpdate):
    db = SessionLocal()
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    
    if trip is None:
        db.close()
        raise HTTPException(status_code=404, detail=f"Trip with id {trip_id} not found")
    
    trip.budget = request.budget
    trip.daily_budget = calculate_daily_budget(request.budget, trip.days)
    trip.category = get_trip_category(request.budget)
    
    db.commit()
    db.refresh(trip)
    db.close()
    return trip