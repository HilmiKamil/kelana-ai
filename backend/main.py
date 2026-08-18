from fastapi import FastAPI 
from pydantic import BaseModel
from services.trip_service import (
    calculate_daily_budget,
    get_trip_category,
    get_transportation_recommendation
)

class TripRequest(BaseModel):
    destination: str
    days: int
    budget: float
    travel_style: str

app = FastAPI()

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

@app.post("/api/v1/trips")
def create_trip(request: TripRequest):
    daily_budget = calculate_daily_budget(
        request.budget, request.days
    )
    category = get_trip_category(
        request.budget
    )
    recommendation_transport = get_transportation_recommendation(category)
    return {
        "destination" : request.destination,
        "budget" : request.budget,
        "daily_budget" : daily_budget,
        "category" : category,
        "recommendation_transport" : recommendation_transport,
    }