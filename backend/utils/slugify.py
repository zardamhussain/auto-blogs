import re
import unicodedata

# Common English stop-words to drop from slugs to keep them concise.
_STOP_WORDS = {
    "a", "an", "and", "the", "of", "for", "in", "to", "on", "at", "with", "by", "from", "about", "as"
}

_SLUG_RX = re.compile(r"[^a-z0-9]+")

def slugify(text: str, max_len: int | None = 64) -> str:
    """Return a deterministic, SEO-friendly slug for *text*.

    • Accent-strips & lower-cases (using NFKD fold)
    • Removes English stop-words
    • Collapses non-alnum chars to a single hyphen
    • Truncates to *max_len* preserving word boundaries
    """
    if not text:
        return "post"

    # ASCII-fold & lower.
    norm = unicodedata.normalize("NFKD", text)
    norm = norm.encode("ascii", "ignore").decode().lower()

    words = [w for w in re.split(r"\W+", norm) if w and w not in _STOP_WORDS]
    slug = "-".join(words)
    slug = _SLUG_RX.sub("-", slug).strip("-")

    if max_len and len(slug) > max_len:
        slug = "-".join(slug[:max_len].split("-")[:-1]) or slug[:max_len]

    return slug or "post" 