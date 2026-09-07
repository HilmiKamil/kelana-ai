import os
import boto3
from urllib.parse import unquote
from dotenv import load_dotenv

load_dotenv()

# ---------------------------------------------------------------------------
# Configuration — read from .env
# ---------------------------------------------------------------------------

AWS_REGION        = os.getenv("AWS_REGION")
KNOWLEDGE_BASE_ID = os.getenv("KNOWLEDGE_BASE_ID")

# MODEL_ID is the primary key; KNOWLEDGE_BASE_MODEL_ARN is the fallback
MODEL_ID = os.getenv("MODEL_ID") or os.getenv("KNOWLEDGE_BASE_MODEL_ARN")

# Number of document chunks to retrieve per query
RETRIEVE_TOP_K = 5


# ---------------------------------------------------------------------------
# Helper: extract source URI dynamically — no hardcoded location type
# ---------------------------------------------------------------------------

def _get_source_uri(location: dict) -> str:
    """
    Extract the URI from a retrieval result's location block.

    Bedrock KB can return different location types (S3, web, confluence, etc.).
    Instead of hardcoding 's3Location', we read the 'type' field and derive
    the sub-dictionary name dynamically.

    Returns an empty string when nothing is available.
    """
    try:
        location_type = location.get("type", "")                        # e.g. "S3"
        location_key  = f"{location_type.lower()}Location"              # e.g. "s3Location"
        location_data = location.get(location_key, {})                  # e.g. {"uri": "s3://..."}

        # Try common URI keys in order
        return (
            location_data.get("uri")
            or location_data.get("url")
            or ""
        )
    except Exception:
        return ""


# ---------------------------------------------------------------------------
# Helper: extract a clean, human-readable document title
# ---------------------------------------------------------------------------

def _get_document_title(result: dict) -> str:
    """
    Derive a clean document title from a retrieval result.

    Priority order:
      1. Common metadata keys (title, document_title, file_name, name, x-amz-bedrock-kb-source-uri)
      2. Source URI from the location block  →  basename + URL-decode (%20 → space)
      3. Fallback: "Untitled source"
    """
    try:
        meta = result.get("metadata", {})

        # ── 1. Metadata keys ────────────────────────────────────────────────
        for key in ("title", "document_title", "file_name", "name",
                    "x-amz-bedrock-kb-source-uri"):
            raw = meta.get(key)
            if raw:
                # Strip path and decode URL-encoding (e.g. %20 → space)
                clean = unquote(os.path.basename(str(raw).rstrip("/")))
                if clean:
                    return clean

        # ── 2. Fall back to the location URI ────────────────────────────────
        location = result.get("location", {})
        uri = _get_source_uri(location)
        if uri:
            clean = unquote(os.path.basename(uri.rstrip("/")))
            if clean:
                return clean

    except Exception:
        pass

    # ── 3. Final fallback ────────────────────────────────────────────────────
    return "Untitled source"


# ---------------------------------------------------------------------------
# Main RAG function
# ---------------------------------------------------------------------------

def retrieve_and_generate(query: str) -> dict:
    """
    Retrieve relevant document chunks from the Bedrock Knowledge Base and
    generate a grounded answer using the configured LLM.

    Calls are made explicitly in two steps (retrieve → converse) so we can
    extract and return the source documents alongside the answer.

    Args:
        query: The user's natural-language question.

    Returns:
        {
            "answer":    str  — Markdown-formatted answer from the LLM.
            "documents": list — Unique source document titles that were used.
        }

    Raises:
        RuntimeError: If any required environment variable is missing.
    """

    # ── 1. Validate environment ──────────────────────────────────────────────
    missing = [
        name for name, value in [
            ("AWS_REGION",        AWS_REGION),
            ("MODEL_ID / KNOWLEDGE_BASE_MODEL_ARN", MODEL_ID),
            ("KNOWLEDGE_BASE_ID", KNOWLEDGE_BASE_ID),
        ]
        if not value
    ]
    if missing:
        raise RuntimeError(
            f"Missing required environment variable(s): {', '.join(missing)}"
        )

    # ── 2. Initialise AWS clients ────────────────────────────────────────────
    # bedrock-agent-runtime → Knowledge Base document retrieval
    # bedrock-runtime       → LLM inference via the Converse API
    kb_client  = boto3.client("bedrock-agent-runtime", region_name=AWS_REGION)
    llm_client = boto3.client("bedrock-runtime",       region_name=AWS_REGION)

    # ── 3. Retrieve relevant document chunks ────────────────────────────────
    retrieve_response = kb_client.retrieve(
        knowledgeBaseId=KNOWLEDGE_BASE_ID,
        retrievalQuery={"text": query},
        retrievalConfiguration={
            "managedSearchConfiguration": {      # ← required by our KB setup
                "numberOfResults": RETRIEVE_TOP_K,
            }
        },
    )

    results = retrieve_response.get("retrievalResults", [])

    # Collect text chunks and document titles from each result
    chunks     = []
    seen_titles = set()   # use a set to guarantee uniqueness

    for result in results:
        # Chunk text
        text = result.get("content", {}).get("text", "").strip()
        if text:
            chunks.append(text)

        # Document title — deduplicated via the set
        title = _get_document_title(result)
        seen_titles.add(title)

    # ── 4. Build context string ──────────────────────────────────────────────
    context = "\n\n---\n\n".join(chunks) if chunks else "No relevant context found."

    # ── 5. Generate answer via LLM (Converse API) ────────────────────────────
    prompt = (
        "Answer the question using the context below. "
        "If the context does not contain enough information, say so. "
        "Return the answer in markdown format.\n\n"
        f"Context:\n{context}\n\n"
        f"Question:\n{query}"
    )

    llm_response = llm_client.converse(
        modelId=MODEL_ID,
        messages=[
            {
                "role": "user",
                "content": [{"text": prompt}],
            }
        ],
    )

    answer: str = llm_response["output"]["message"]["content"][0]["text"]

    # ── 6. Return structured result ──────────────────────────────────────────
    return {
        "answer":    answer,
        "documents": list(seen_titles),   # convert set → list for JSON serialisation
    }
