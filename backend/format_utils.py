"""
format_utils.py — Name formatting utilities for RMS Face AI backend.
"""
import re

def format_person_name(name: str) -> str:
    """
    Format a dataset/model label into a clean, human-readable Title Case name.
    Example: 'vatsal_vadgama' -> 'Vatsal Vadgama'
    Example: 'dhruvik' -> 'Dhruvik'
    """
    if not name or not isinstance(name, str):
        return "Unknown"
    trimmed = name.strip()
    special = {'Unknown', '[UNTRAINED]', 'Not Trained', 'Not Loaded', 'Error', 'Disabled', 'SPOOF', 'SPOOF DETECTED', 'NOT FOUND'}
    if trimmed in special:
        return trimmed

    cleaned = re.sub(r'\.(jpg|jpeg|png|webp)$', '', trimmed, flags=re.IGNORECASE)
    cleaned = re.sub(r'[_-]+', ' ', cleaned).strip()
    if not cleaned:
        return "Unknown"
    return ' '.join(word.capitalize() for word in cleaned.split())
