"""Deterministic safety and pre-send quality gates for cold outreach."""

import re
from typing import List, Tuple

# Banned cliché phrases that signal generic spam
BANNED_PHRASES = frozenset({
    "hope this email finds you well",
    "hope you are well",
    "i know you are busy",
    "touching base",
    "checking in",
    "reaching out to see",
    "synergy",
    "game-changer",
    "game changer",
    "revolutionary",
    "best-in-class",
    "cutting-edge",
    "paradigm shift",
    "disruptive technology",
    "magic bullet",
    "low-hanging fruit",
    "move the needle",
})

# Unrendered merge tags / placeholder tokens that must NEVER leak to recipients
MERGE_TAG_PATTERNS = [
    re.compile(r"\{\{\s*[\w\.-]+\s*\}\}"),  # {{first_name}}, {{company}}
    re.compile(r"\[(?:name|first_name|last_name|company|title|industry|prospect)\]", re.IGNORECASE),  # [Company]
    re.compile(r"<insert\s+[^>]+>", re.IGNORECASE),  # <insert name>
    re.compile(r"\[insert\s+[^\]]+\]", re.IGNORECASE),  # [insert company]
    re.compile(r"\{first_name\}|\{company\}|\{name\}", re.IGNORECASE),
]


def check_word_count(text: str, max_words: int = 125) -> Tuple[bool, int, str]:
    """Verify email body does not exceed maximum word limit."""
    words = text.strip().split()
    count = len(words)
    if count > max_words:
        return False, count, f"Word count ({count}) exceeds maximum allowed ({max_words})."
    return True, count, ""


def check_merge_tags(text: str) -> Tuple[bool, List[str]]:
    """Verify zero unrendered merge-tags or placeholder tokens exist."""
    found = []
    for pattern in MERGE_TAG_PATTERNS:
        matches = pattern.findall(text)
        if matches:
            found.extend(matches)
    if found:
        return False, [f"Unrendered merge-tag detected: '{m}'" for m in set(found)]
    return True, []


def check_banned_phrases(text: str) -> Tuple[bool, List[str]]:
    """Detect spam clichés and banned phrases."""
    lower_text = text.lower()
    violations = []
    for phrase in BANNED_PHRASES:
        if phrase in lower_text:
            violations.append(f"Contains banned spam cliché: '{phrase}'")
    return len(violations) == 0, violations


def check_email_quality(subject: str, body: str, max_words: int = 125) -> Tuple[bool, List[str], int]:
    """Run full deterministic pre-send verification suite."""
    violations: List[str] = []

    # 1. Word Count Check
    wc_passed, word_count, wc_msg = check_word_count(body, max_words=max_words)
    if not wc_passed:
        violations.append(wc_msg)

    # 2. Merge-Tag Leak Check (Subject & Body)
    tags_passed_subj, subj_tags = check_merge_tags(subject)
    if not tags_passed_subj:
        violations.extend([f"Subject: {msg}" for msg in subj_tags])

    tags_passed_body, body_tags = check_merge_tags(body)
    if not tags_passed_body:
        violations.extend([f"Body: {msg}" for msg in body_tags])

    # 3. Banned Cliché Phrases Check
    phrases_passed, phrase_violations = check_banned_phrases(body)
    if not phrases_passed:
        violations.extend(phrase_violations)

    # 4. Subject Line Quality Check
    if not subject.strip():
        violations.append("Subject line is missing or empty.")
    elif len(subject.split()) > 9:
        violations.append("Subject line is too long (> 9 words). Cold email subjects must be concise.")

    # 5. Empty Body Check
    if not body.strip():
        violations.append("Email body is empty.")

    passed = len(violations) == 0
    return passed, violations, word_count
