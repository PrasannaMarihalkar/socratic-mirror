"""
Decides when to advance the Socratic depth level.
v1: Rule-based signals from student message content.
v2 (planned): ML classifier trained on session data.
"""

# These signals suggest the student is reasoning well → advance depth
ADVANCEMENT_SIGNALS = [
    "because", "therefore", "which means", "this implies",
    "so that means", "i think", "i believe", "my reasoning",
    "the reason is", "this suggests", "this shows", "in other words",
    "if we", "that means", "due to", "as a result",
    # Kannada reasoning signals
    "ಏಕೆಂದರೆ", "ಆದ್ದರಿಂದ", "ಅಂದರೆ", "ಹಾಗಾಗಿ",
]

# These signals suggest the student is confused or stuck → hold or go back
REGRESSION_SIGNALS = [
    "i don't know", "idk", "no idea", "what do you mean",
    "i'm confused", "just tell me", "can you explain",
    "i give up", "i don't understand", "i'm not sure what",
    "ಗೊತ್ತಿಲ್ಲ",
]


def classify_next_depth(
    student_message: str,
    current_depth: int,
    turn_number: int,
) -> int:
    msg_lower = student_message.lower()

    # Check for regression signals first
    if any(signal in msg_lower for signal in REGRESSION_SIGNALS):
        return max(1, current_depth - 1)

    # Count how many advancement signals are present
    signals_found = sum(
        1 for signal in ADVANCEMENT_SIGNALS if signal in msg_lower
    )

    word_count = len(student_message.split())

    # Advance if: student shows reasoning AND response is substantive
    if signals_found >= 1 and word_count >= 15:
        return min(8, current_depth + 1)

    # Natural slow progression: every 3 turns, nudge depth up
    if turn_number > 0 and turn_number % 3 == 0:
        return min(8, current_depth + 1)

    return current_depth