from groq import Groq
from app.core.config import settings
from app.prompts.socratic_system import build_system_prompt, DEPTH_LEVELS
from app.services.depth_classifier import classify_next_depth
from app.services.frustration_detector import compute_frustration_score
from app.services import db

# Groq client — free, fast
client = Groq(api_key=settings.groq_api_key)


def generate_probe(
    session_id: str,
    student_message: str,
    topic: str,
    conversation_history: list,
    current_depth: int,
    language: str,
    consecutive_short_responses: int,
    turn_number: int,
) -> dict:
    # If student is already at L8 and has just answered the reflection question
    # (i.e. the previous AI message was a reflection-depth question), end session
    if current_depth == 8 and turn_number > 1 and conversation_history:
        last_msg = conversation_history[-1]
        if last_msg.get("role") == "assistant":
            db.save_turn(
                session_id=session_id,
                turn_number=turn_number,
                student_message=student_message,
                probe_question="Thank you for reflecting. This thinking session is now complete. 🎯",
                depth_level=8,
                depth_label="Reflection",
                frustration_score=0.0,
            )
            db.update_session(session_id, 8, turn_number)
            return {
                "probe": "Thank you for reflecting. This thinking session is now complete. 🎯",
                "depth_used": 8,
                "depth_label": "Reflection",
                "next_depth": 8,
                "frustration_score": 0.0,
                "turn_number": turn_number,
                "session_complete": True,
            }

    # Step 1: Detect frustration
    frustration_score = compute_frustration_score(
        student_message, consecutive_short_responses
    )
    # Step 2: Soften depth if student is frustrated
    effective_depth = max(1, current_depth - 1) if frustration_score > 0.7 else current_depth
    # Step 3: Build the system prompt for this depth level
    system_prompt = build_system_prompt(effective_depth, topic, language)
    # Step 4: Build message history
    messages = conversation_history + [
        {"role": "user", "content": student_message}
    ]
    # Step 5: Call Groq API (free!)
    response = client.chat.completions.create(
        model="openai/gpt-oss-120b",
        max_tokens=600,
        messages=[
            {"role": "system", "content": system_prompt},
            *messages
        ],
    )
    probe_question = response.choices[0].message.content.strip()
    # Step 6: Classify next depth level
    next_depth = classify_next_depth(student_message, effective_depth, turn_number)
    # Step 7: Save to database
    db.save_turn(
        session_id=session_id,
        turn_number=turn_number,
        student_message=student_message,
        probe_question=probe_question,
        depth_level=effective_depth,
        depth_label=DEPTH_LEVELS[effective_depth]["name"],
        frustration_score=frustration_score,
    )
    # Step 8: Update session metadata
    db.update_session(session_id, next_depth, turn_number)
    return {
        "probe": probe_question,
        "depth_used": effective_depth,
        "depth_label": DEPTH_LEVELS[effective_depth]["name"],
        "next_depth": next_depth,
        "frustration_score": frustration_score,
        "turn_number": turn_number,
    }