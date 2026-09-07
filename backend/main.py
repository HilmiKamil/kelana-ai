import os

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
from pydantic import BaseModel, EmailStr
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from botocore.exceptions import ClientError

from database import init_db
from models.conversation import Conversation
from models.message import Message
from models.trip import Trip
from models.user import User
from services.auth_service import (
    get_current_user,
    get_db,
    login_user,
    register_user,
)
from services.bedrock_service import get_ai_recommendations, get_chat_response
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

class ConversationResponse(BaseModel):
    id:         int
    title:      str | None
    created_at: datetime

    class Config:
        from_attributes = True

class CreateConversationRequest(BaseModel):
    title: str | None = None   

class ConversationRenameRequest(BaseModel):
    title: str

class SendMessageRequest(BaseModel):
    message: str

class MessageResponse(BaseModel):
    role:       str
    content:    str
    created_at: datetime

    class Config:
        from_attributes = True

# ---------------------------------------------------------------------------
# App + middleware
# ---------------------------------------------------------------------------

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Ubah jadi ["*"] sementara untuk memastikan bukan karena diblokir CORS
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


# ---------------------------------------------------------------------------
# Conversation endpoints
# ---------------------------------------------------------------------------

@app.post("/api/v1/conversations", status_code=201)
def create_conversation(
    request: CreateConversationRequest = CreateConversationRequest(),
    db:   Session = Depends(get_db),
    user: User    = Depends(get_current_user),
):
    """
    Create a new conversation thread owned by the authenticated user.
    Accepts an optional title; if omitted the title remains null.
    Returns the ID of the newly created conversation.
    """
    conversation = Conversation(user_id=user.id, title=request.title)
    db.add(conversation)
    db.commit()
    db.refresh(conversation)
    return {"conversation_id": conversation.id}


@app.get("/api/v1/conversations", response_model=list[ConversationResponse])
def list_conversations(
    db:   Session = Depends(get_db),
    user: User    = Depends(get_current_user),
):
    """
    Return all conversation threads belonging to the authenticated user,
    ordered most-recent first.
    """
    return (
        db.query(Conversation)
        .filter(Conversation.user_id == user.id)
        .order_by(Conversation.created_at.desc())
        .all()
    )


@app.patch("/api/v1/conversations/{conversation_id}", response_model=ConversationResponse)
def rename_conversation(
    conversation_id: int,
    request: ConversationRenameRequest,
    db:   Session = Depends(get_db),
    user: User    = Depends(get_current_user),
):
    """
    Rename an existing conversation thread.
    Validates ownership via JWT — only the owner can rename their conversation.
    """
    conversation = db.query(Conversation).filter(
        Conversation.id == conversation_id
    ).first()

    if conversation is None:
        raise HTTPException(
            status_code=404,
            detail=f"Conversation {conversation_id} not found.",
        )

    if conversation.user_id != user.id:
        raise HTTPException(
            status_code=403,
            detail="You are not authorized to rename this conversation.",
        )

    conversation.title = request.title
    db.commit()
    db.refresh(conversation)
    return conversation


@app.delete("/api/v1/conversations/{conversation_id}", status_code=200)
def delete_conversation(
    conversation_id: int,
    db:   Session = Depends(get_db),
    user: User    = Depends(get_current_user),
):
    """
    Delete a conversation and all its messages.
    Validates ownership via JWT — only the owner can delete their conversation.
    """
    # 1. Fetch by ID only
    conversation = db.query(Conversation).filter(
        Conversation.id == conversation_id
    ).first()

    # 2. 404 if not found
    if conversation is None:
        raise HTTPException(
            status_code=404,
            detail=f"Conversation {conversation_id} not found.",
        )

    # 3. 403 if owned by a different user
    if conversation.user_id != user.id:
        raise HTTPException(
            status_code=403,
            detail="You are not authorized to delete this conversation.",
        )

    # 4. Ownership confirmed — delete (cascade removes messages via FK)
    db.delete(conversation)
    db.commit()
    return {"message": f"Conversation {conversation_id} deleted successfully."}


@app.post(
    "/api/v1/conversations/{conversation_id}/messages",
    response_model=MessageResponse,
    status_code=201,
)
def send_message(
    conversation_id: int,
    request: SendMessageRequest,
    db:   Session = Depends(get_db),
    user: User    = Depends(get_current_user),
):
    """
    Core chat orchestration endpoint.

    Steps:
      1. Validate conversation exists and belongs to the authenticated user.
      2. Save the user's message to the messages table.
      3. Load the full conversation history (oldest → newest).
      4. Build the message array expected by the Bedrock Converse API.
      5. Send the history to Bedrock and get the AI response.
      6. Save the AI response to the messages table.
      7. Return the AI response text to the client.
    """

    # ── 1. Validate conversation ownership ──────────────────────────────────
    conversation = db.query(Conversation).filter(
        Conversation.id == conversation_id
    ).first()

    if conversation is None:
        raise HTTPException(
            status_code=404,
            detail=f"Conversation {conversation_id} not found.",
        )

    if conversation.user_id != user.id:
        raise HTTPException(
            status_code=403,
            detail="You are not authorized to access this conversation.",
        )

    # ── 2. Save the user's message ───────────────────────────────────────────
    user_message = Message(
        conversation_id=conversation_id,
        role="user",
        content=request.message,
    )
    db.add(user_message)
    db.commit()

    # ── 3. Load full conversation history (ascending — oldest first) ─────────
    history = (
        db.query(Message)
        .filter(Message.conversation_id == conversation_id)
        .order_by(Message.created_at.asc())
        .all()
    )

    # ── 4 & 5. Build prompt and call Bedrock via the service layer ───────────
    ai_text: str = get_chat_response(history)

    # ── 6. Save the AI response ──────────────────────────────────────────────
    ai_message = Message(
        conversation_id=conversation_id,
        role="assistant",
        content=ai_text,
    )
    db.add(ai_message)
    db.commit()
    db.refresh(ai_message)   # populate created_at from the DB server_default

    # ── 7. Return the AI response ────────────────────────────────────────────
    # Return the ORM object directly — FastAPI serialises it via
    # MessageResponse(from_attributes=True), which includes created_at.
    return ai_message


@app.get(
    "/api/v1/conversations/{conversation_id}/messages",
    response_model=list[MessageResponse],
)
def get_messages(
    conversation_id: int,
    db:   Session = Depends(get_db),
    user: User    = Depends(get_current_user),
):
    """
    Return the full message history for a conversation, oldest first.
    Validates that the conversation belongs to the authenticated user.
    """
    conversation = db.query(Conversation).filter(
        Conversation.id == conversation_id
    ).first()

    if conversation is None:
        raise HTTPException(
            status_code=404,
            detail=f"Conversation {conversation_id} not found.",
        )

    if conversation.user_id != user.id:
        raise HTTPException(
            status_code=403,
            detail="You are not authorized to access this conversation.",
        )

    return (
        db.query(Message)
        .filter(Message.conversation_id == conversation_id)
        .order_by(Message.created_at.asc())
        .all()
    )
