"""
Detects whether a student is frustrated or disengaging.
v1: Rule-based heuristics.
v2 (planned): Fine-tuned classifier on Socratic dialogue dataset.
"""

HIGH_FRUSTRATION = [
    "just tell me", "give me the answer", "this is useless",
    "stop asking questions", "i give up", "forget it",
    "you're not helping", "just say it", "ugh",
    "this is stupid", "what's the point", "i don't get it",
    "ಹೇಳಿ ಬಿಡು", "ಸಾಕು", "ಗೊತ್ತಿಲ್ಲ",
]

MEDIUM_FRUSTRATION = [
    "i don't understand", "i'm confused", "i have no idea",
    "what are you even asking", "i don't know what you want",
    "can you just", "please just", "i'm lost",
]

LOW_FRUSTRATION = [
    "hmm", "not sure", "maybe", "i think so", "possibly", "i guess",
]


def compute_frustration_score(
    student_message: str,
    consecutive_short_responses: int = 0,
) -> float:
    msg_lower = student_message.lower().strip()
    score = 0.0

    for signal in HIGH_FRUSTRATION:
        if signal in msg_lower:
            score += 0.4

    for signal in MEDIUM_FRUSTRATION:
        if signal in msg_lower:
            score += 0.2

    for signal in LOW_FRUSTRATION:
        if signal in msg_lower:
            score += 0.05

    # Very short consecutive messages = likely disengaging
    score += consecutive_short_responses * 0.1

    # Short message penalty
    word_count = len(student_message.split())
    if word_count < 4:
        score += 0.15

    # Cap score between 0 and 1
    return round(min(1.0, score), 2)