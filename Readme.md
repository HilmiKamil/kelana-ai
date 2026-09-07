# KelanaAI — AI Travel Planner

KelanaAI adalah aplikasi travel planner berbasis AI yang dibangun dengan **Amazon Bedrock**, **Next.js**, dan **FastAPI**.  
*Kelana* (Bahasa Indonesia) = wanderer / traveller.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, TypeScript, Tailwind CSS v4 |
| Backend | FastAPI, Python 3.12, SQLAlchemy |
| Database | PostgreSQL (Neon for cloud) |
| AI | Amazon Bedrock — Nova Lite model |
| Auth | JWT (python-jose) + bcrypt |

---

## Project Structure

```
kelana-ai/
├── backend/          # FastAPI application
│   ├── main.py       # All API routes
│   ├── models/       # SQLAlchemy ORM models
│   ├── services/     # Business logic (auth, bedrock, trips)
│   ├── migrations/   # SQL migration files
│   ├── migrate.py    # Migration runner
│   └── requirement.txt
└── frontend/         # Next.js application
    ├── app/          # App Router pages
    ├── components/   # Shared UI components
    └── services/     # API service functions
```

---

## Local Development

### Prerequisites

- Python 3.12
- Node.js 18+
- PostgreSQL (local) or a Neon connection string
- AWS credentials with Bedrock access

### 1. Backend

```bash
cd backend

# Create and activate virtual environment
python -m venv .venv
.venv\Scripts\activate          # Windows
# source .venv/bin/activate     # macOS/Linux

# Install dependencies
pip install -r requirement.txt

# Configure environment
cp .env_local .env              # edit DATABASE_URL, AWS keys, SECRET_KEY

# Run database migrations
python migrate.py

# Start development server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Backend runs at: `http://localhost:8000`  
API docs: `http://localhost:8000/docs`

### 2. Frontend

```bash
cd frontend

npm install

# Configure environment
# Edit .env — set NEXT_PUBLIC_API_URL=http://localhost:8000

npm run dev
```

Frontend runs at: `http://localhost:3000`

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `AWS_REGION` | AWS region (e.g. `ap-southeast-2`) |
| `AWS_ACCESS_KEY_ID` | AWS access key |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key |
| `MODEL_ID` | Bedrock model ID (e.g. `amazon.nova-lite-v1:0`) |
| `KNOWLEDGE_BASE_ID` | Bedrock Knowledge Base ID |
| `SECRET_KEY` | JWT signing secret (use a strong random string) |
| `ALGORITHM` | JWT algorithm (default: `HS256`) |
| `JWT_EXPIRE_MINUTES` | Token lifetime in minutes (default: `60`) |
| `FRONTEND_URL` | Allowed CORS origin (e.g. `http://localhost:3000`) |

### Frontend (`frontend/.env`)

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Backend base URL (e.g. `http://localhost:8000`) |

---

## Cloud Deployment

### Backend → Render

1. Create a new **Web Service** on [render.com](https://render.com).
2. Set **Root Directory** to `backend`.
3. Set **Build Command**: `pip install -r requirement.txt`
4. Set **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Add all backend environment variables in the Render dashboard.
6. Run migrations once via the Render **Shell**: `python migrate.py`

### Database → Neon

1. Create a free PostgreSQL database at [neon.tech](https://neon.tech).
2. Copy the connection string and set it as `DATABASE_URL` in Render.

### Frontend → Vercel

1. Import the repository at [vercel.com](https://vercel.com).
2. Set **Root Directory** to `frontend`.
3. Add environment variable:
   - `NEXT_PUBLIC_API_URL` = your Render backend URL (e.g. `https://kelana-ai.onrender.com`)
4. Deploy — Vercel auto-detects Next.js and builds it.

---

## API Endpoints

### Auth
| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/v1/auth/register` | Register new user |
| `POST` | `/api/v1/auth/login` | Login, returns JWT |
| `GET` | `/api/v1/auth/me` | Get current user profile |

### Trips
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/trips` | List user's trips |
| `POST` | `/api/v1/trips` | Generate new AI trip |
| `GET` | `/api/v1/trips/{id}` | Get trip detail |
| `PUT` | `/api/v1/trips/{id}` | Update trip budget |
| `DELETE` | `/api/v1/trips/{id}` | Delete trip |

### Chat
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/conversations` | List conversations |
| `POST` | `/api/v1/conversations` | Create conversation |
| `PATCH` | `/api/v1/conversations/{id}` | Rename conversation |
| `DELETE` | `/api/v1/conversations/{id}` | Delete conversation |
| `GET` | `/api/v1/conversations/{id}/messages` | Get messages |
| `POST` | `/api/v1/conversations/{id}/messages` | Send message |

### Knowledge Base
| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/v1/ask` | RAG query against Bedrock KB |

---

## License

MIT — free to use, modify, and distribute.
