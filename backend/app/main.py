from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import health, session, chat

app = FastAPI(
    title="Socratic Mirror API",
    description="LLM-powered Socratic dialogue engine for reflective learning",
    version="0.1.0",
)

# CORS — allows the React frontend to talk to this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",   # React dev server
        "https://socratic-mirror.vercel.app",  # Production frontend
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register all routes
app.include_router(health.router)
app.include_router(session.router, prefix="/api/v1")
app.include_router(chat.router, prefix="/api/v1")


@app.get("/")
def root():
    return {"message": "Socratic Mirror API is running"}