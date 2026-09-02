import os

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from botocore.exceptions import ClientError

from database import init_db
from models.trip import Trip
from models.user import User
from services.auth_service import (
    get_current_user,
    get_db,
    login_user,
    register_user,
)
from services.bedrock_service import get_ai_recommendations
from services.kb_service import retrieve_and_generate
from services.trip_service import (
    calculate_daily_budget,
    get_trip_category,
    get_transportation_recommendation,
)

load_dotenv()

# ---------------------------------------------------------------------------
# Pydantic schemas
# ---------------------------------------------------------------------------

class TripRequest(BaseModel):
    destination: str
    days: int
    budget: float
    travel_style: str

class TripUpdate(BaseModel):
    budget: float

class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class AskRequest(BaseModel):
    question: str

class AskResponse(BaseModel):
    question:  str
    answer:    str
    documents: list[str]

# ---------------------------------------------------------------------------
# App + middleware
# ---------------------------------------------------------------------------

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        os.getenv("FRONTEND_URL", "http://localhost:3000"),
        "http://localhost:3001" 
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

init_db()

# ---------------------------------------------------------------------------
# General endpoints
# ---------------------------------------------------------------------------

@app.get("/")
def home():
    return {"message": "Welcome to KelanaAI"}

@app.get("/health")
def health():
    return {"status": "OK"}

@app.get("/trip_categories")
def trip_categories():
    return ["Backpacker", "Standard", "Luxury"]

@app.get("/recommendations")
def recommendations():
    return ["Tokyo Tower", "Mount Fuji", "Shibuya"]

@app.get("/transportations")
def transportations():
    return ["Bus", "Train", "Flight"]

# ---------------------------------------------------------------------------
# Auth endpoints
# ---------------------------------------------------------------------------

@app.post("/api/v1/auth/register", status_code=201)
def register_endpoint(request: RegisterRequest, db: Session = Depends(get_db)):
    """
    Register a new user account.
    Returns 201 on success, 409 if the email is already taken.
    Plain-text password is NEVER persisted.
    """
    try:
        user = register_user(
            db=db,
            name=request.name,
            email=request.email,
            password=request.password,
        )
        return {"id": user.id, "name": user.name, "email": user.email}
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc))
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="An account with this email already exists.",
        )


@app.post("/api/v1/auth/login", status_code=200)
def login_endpoint(request: LoginRequest, db: Session = Depends(get_db)):
    """
    Authenticate and return a JWT Bearer token.
    Returns 200 {"access_token": "ey...", "token_type": "bearer"}.
    Returns 401 on invalid credentials. Stateless — no server session.
    """
    try:
        return login_user(db=db, email=request.email, password=request.password)
    except ValueError as exc:
        raise HTTPException(status_code=401, detail=str(exc))


@app.get("/api/v1/auth/me")
def get_me(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """
    Return the authenticated user's profile.
    Requires a valid Bearer JWT. No user_id in the URL — identity comes
    entirely from the token's `sub` claim.
    """
    return {"id": user.id, "name": user.name, "email": user.email}

# ---------------------------------------------------------------------------
# Trip endpoints
# ---------------------------------------------------------------------------

@app.get("/api/v1/trips")
def list_trips(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """
    Protected — requires a valid Bearer JWT.
    Returns only the trips that belong to the authenticated user.
    """
    return db.query(Trip).filter(Trip.user_id == user.id).all()


@app.get("/api/v1/trips/{trip_id}")
def get_trip(
    trip_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    trip = db.query(Trip).filter(Trip.id == trip_id, Trip.user_id == user.id).first()
    if trip is None:
        raise HTTPException(status_code=404, detail=f"Trip {trip_id} not found.")
    return trip


@app.post("/api/v1/trips/{trip_id}/generate")
def generate_ai_recommendation(
    trip_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    trip = db.query(Trip).filter(Trip.id == trip_id, Trip.user_id == user.id).first()
    if trip is None:
        raise HTTPException(status_code=404, detail=f"Trip {trip_id} not found.")

    trip.ai_recommendation = get_ai_recommendations(
        destination=trip.destination,
        days=trip.days,
        budget=trip.budget,
        travel_style=trip.category,
    )
    db.commit()
    db.refresh(trip)
    return trip


@app.post("/api/v1/trips")
def create_trip(
    request: TripRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    trip = Trip(
        user_id=user.id,
        destination=request.destination,
        days=request.days,
        budget=request.budget,
        category=get_trip_category(request.budget),
        daily_budget=calculate_daily_budget(request.budget, request.days),
        travel_style=request.travel_style,
        ai_recommendation=get_ai_recommendations(
            destination=request.destination,
            days=request.days,
            budget=request.budget,
            travel_style=request.travel_style,
        ),
    )
    db.add(trip)
    db.commit()
    db.refresh(trip)
    return trip


@app.delete("/api/v1/trips/{trip_id}")
def delete_trip(
    trip_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    # 1. Fetch by trip_id only — no user filter yet
    trip = db.query(Trip).filter(Trip.id == trip_id).first()

    # 2. 404 if the trip doesn't exist at all
    if trip is None:
        raise HTTPException(status_code=404, detail=f"Trip {trip_id} not found.")

    # 3. 403 if the trip belongs to a different user
    if trip.user_id != user.id:
        raise HTTPException(
            status_code=403,
            detail="You are not authorized to modify or delete this trip.",
        )

    # 4. Ownership confirmed — proceed with deletion
    db.delete(trip)
    db.commit()
    return {"message": f"Trip {trip_id} deleted successfully."}


@app.put("/api/v1/trips/{trip_id}")
def update_trip(
    trip_id: int,
    request: TripUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    # 1. Fetch by trip_id only — no user filter yet
    trip = db.query(Trip).filter(Trip.id == trip_id).first()

    # 2. 404 if the trip doesn't exist at all
    if trip is None:
        raise HTTPException(status_code=404, detail=f"Trip {trip_id} not found.")

    # 3. 403 if the trip belongs to a different user
    if trip.user_id != user.id:
        raise HTTPException(
            status_code=403,
            detail="You are not authorized to modify or delete this trip.",
        )

    # 4. Ownership confirmed — proceed with update
    trip.budget = request.budget
    trip.daily_budget = calculate_daily_budget(request.budget, trip.days)
    trip.category = get_trip_category(request.budget)
    db.commit()
    db.refresh(trip)
    return trip


# ---------------------------------------------------------------------------
# Knowledge Base / RAG endpoint
# ---------------------------------------------------------------------------

@app.post("/api/v1/ask", response_model=AskResponse)
def ask_knowledge_base(request: AskRequest):
    """
    Accept a natural-language question, run RAG against the Bedrock
    Knowledge Base, and return the generated answer together with the
    list of source documents that were retrieved.
    """
    try:
        result = retrieve_and_generate(request.question)
        return AskResponse(
            question=request.question,
            answer=result["answer"],
            documents=result["documents"],
        )

    except ClientError as exc:
        error   = exc.response.get("Error", {})
        code    = error.get("Code",    "UnknownCode")
        message = error.get("Message", "No message provided by AWS.")
        raise HTTPException(
            status_code=502,
            detail=f"AWS Bedrock error [{code}]: {message}",
        )

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(exc)}",
        )
