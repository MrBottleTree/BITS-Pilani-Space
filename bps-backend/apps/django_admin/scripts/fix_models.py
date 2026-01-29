"""
Post-processing script for inspectdb output.

Adds related_name='+' to all ForeignKey fields that don't already have one.
This prevents reverse-relation name clashes in unmanaged models (which is all
we have, since Django is only used for the admin UI here).
"""

import re
from pathlib import Path

MODELS_FILE = Path(__file__).resolve().parent.parent / "core" / "models.py"


def fix_related_names(content: str) -> str:
    def add_related_name(match: re.Match) -> str:
        text = match.group(0)
        if "related_name" in text:
            return text
        # Insert related_name='+' before the closing paren
        return text[:-1] + ", related_name='+'" + text[-1]

    return re.sub(r"models\.ForeignKey\([^)]+\)", add_related_name, content)


def main():
    text = MODELS_FILE.read_text()
    fixed = fix_related_names(text)
    MODELS_FILE.write_text(fixed)


if __name__ == "__main__":
    main()
