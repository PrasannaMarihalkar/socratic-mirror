from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services import db

router = APIRouter(prefix="/session", tags=["Session"])


class CreateSessionRequest(BaseModel):
    topic: str
    language: str = "english"


@router.post("/start")
def start_session(req: CreateSessionRequest):
    session = db.create_session(req.topic, req.language)
    return {
        "session_id": session["id"],
        "topic": session["topic"],
        "language": session["language"],
        "status": "started",
    }


@router.post("/{session_id}/end")
def finish_session(session_id: str):
    db.end_session(session_id)
    return {"session_id": session_id, "status": "ended"}


@router.get("/{session_id}/turns")
def get_turns(session_id: str):
    turns = db.get_session_turns(session_id)
    return {"session_id": session_id, "turns": turns}