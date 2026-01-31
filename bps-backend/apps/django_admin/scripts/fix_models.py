"""
Post-processing script for inspectdb output.

1. Adds related_name='+' to all ForeignKey fields that don't already have one.
   This prevents reverse-relation name clashes in unmanaged models.
2. Strips out model classes whose db_table matches a Django-managed table
   (e.g. 'admin_uploaded_image') so inspectdb doesn't create a conflicting
   unmanaged duplicate.
"""

import re
from pathlib import Path

MODELS_FILE = Path(__file__).resolve().parent.parent / "core" / "models.py"

# Tables owned by Django-managed models (uploads app, etc.)
MANAGED_TABLES = {'admin_uploaded_image'}


def fix_related_names(content: str) -> str:
    def add_related_name(match: re.Match) -> str:
        text = match.group(0)
        if "related_name" in text:
            return text
        # Insert related_name='+' before the closing paren
        return text[:-1] + ", related_name='+'" + text[-1]

    return re.sub(r"models\.ForeignKey\([^)]+\)", add_related_name, content)


def filter_managed_tables(content: str) -> str:
    """Remove model classes whose db_table is in MANAGED_TABLES."""
    # Split on class definitions, keeping delimiters
    parts = re.split(r'(?=^class \w+\(models\.Model\):)', content, flags=re.MULTILINE)
    kept = []
    for part in parts:
        # Check if this part is a model class with a managed table
        table_match = re.search(r"db_table\s*=\s*['\"](\w+)['\"]", part)
        if table_match and table_match.group(1) in MANAGED_TABLES:
            continue
        kept.append(part)
    return ''.join(kept)


def main():
    text = MODELS_FILE.read_text()
    text = filter_managed_tables(text)
    text = fix_related_names(text)
    MODELS_FILE.write_text(text)


if __name__ == "__main__":
    main()
