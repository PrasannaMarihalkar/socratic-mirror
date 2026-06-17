from fastapi import APIRouter
from pydantic import BaseModel
from app.services.socratic_engine import generate_probe

router = APIRouter(prefix="/chat", tags=["Chat"])


class ChatRequest(BaseModel):
    session_id: str
    student_message: str
    topic: str
    conversation_history: list = []
    current_depth: int = 1
    language: str = "english"
    consecutive_short_responses: int = 0
    turn_number: int = 1


class ChatResponse(BaseModel):
    probe: str
    depth_used: int
    depth_label: str
    next_depth: int
    frustration_score: float
    turn_number: int


@router.post("/probe", response_model=ChatResponse)
def get_probe(req: ChatRequest):
    result = generate_probe(
        session_id=req.session_id,
        student_message=req.student_message,
        topic=req.topic,
        conversation_history=req.conversation_history,
        current_depth=req.current_depth,
        language=req.language,
        consecutive_short_responses=req.consecutive_short_responses,
        turn_number=req.turn_number,
    )
    return ChatResponse(**result)