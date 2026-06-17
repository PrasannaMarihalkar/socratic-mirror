from supabase import create_client, Client
from app.core.config import settings

supabase: Client = create_client(settings.supabase_url, settings.supabase_key)


def create_session(topic: str, language: str) -> dict:
    result = (
        supabase.table("sessions")
        .insert({"topic": topic, "language": language})
        .execute()
    )
    return result.data[0]


def save_turn(
    session_id: str,
    turn_number: int,
    student_message: str,
    probe_question: str,
    depth_level: int,
    depth_label: str,
    frustration_score: float,
) -> dict:
    result = (
        supabase.table("turns")
        .insert({
            "session_id": session_id,
            "turn_number": turn_number,
            "student_message": student_message,
            "probe_question": probe_question,
            "depth_level": depth_level,
            "depth_label": depth_label,
            "frustration_score": frustration_score,
        })
        .execute()
    )
    return result.data[0]


def update_session(session_id: str, new_depth: int, turn_count: int) -> None:
    supabase.table("sessions").update({
        "max_depth_reached": new_depth,
        "turn_count": turn_count,
    }).eq("id", session_id).execute()


def end_session(session_id: str) -> None:
    from datetime import datetime, timezone
    supabase.table("sessions").update({
        "ended_at": datetime.now(timezone.utc).isoformat(),
    }).eq("id", session_id).execute()


def get_session_turns(session_id: str) -> list:
    result = (
        supabase.table("turns")
        .select("*")
        .eq("session_id", session_id)
        .order("turn_number")
        .execute()
    )
    return result.data