import json
from pathlib import Path

from groq import Groq
from langchain_community.document_loaders import (
    DirectoryLoader,
    TextLoader,
)
from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter

from app.core.config import settings


# ---------------------------------------------------------
# Configuration
# ---------------------------------------------------------

KB_PATH = Path(__file__).resolve().parent.parent / "kb"

client = Groq(api_key=settings.groq_api_key)


# ---------------------------------------------------------
# Build Vector Store
# ---------------------------------------------------------

def build_vector_store():
    """
    Load Markdown knowledge-base articles,
    split them into chunks,
    create embeddings,
    and build a FAISS vector store.
    """

    loader = DirectoryLoader(
        str(KB_PATH),
        glob="*.md",
        loader_cls=TextLoader,
        loader_kwargs={"encoding": "utf-8"},
    )

    documents = loader.load()

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=500,
        chunk_overlap=100,
    )

    chunks = splitter.split_documents(documents)

    embeddings = HuggingFaceEmbeddings(
        model_name="sentence-transformers/all-MiniLM-L6-v2"
    )

    vector_store = FAISS.from_documents(
        chunks,
        embeddings,
    )

    return vector_store


# ---------------------------------------------------------
# Retrieve Relevant Documents
# ---------------------------------------------------------

def retrieve_relevant_documents(
    vector_store,
    query: str,
    k: int = 3,
):
    """
    Retrieve the most relevant KB chunks for a query.
    """

    return vector_store.similarity_search(
        query,
        k=k,
    )


# ---------------------------------------------------------
# Generate AI Draft
# ---------------------------------------------------------

def generate_ai_draft(
    title: str,
    description: str,
    vector_store,
):
    """
    Retrieve relevant KB content and generate
    a grounded AI response using Groq.
    """

    query = f"{title}\n{description}"

    documents = retrieve_relevant_documents(
        vector_store,
        query,
        k=3,
    )

    # -----------------------------------------------------
    # No documents found
    # -----------------------------------------------------

    if not documents:
        return {
            "draft": (
                "No relevant knowledge-base article was found "
                "for this issue."
            ),
            "citations": [],
            "documents": [],
        }

    # -----------------------------------------------------
    # Prepare KB context
    # -----------------------------------------------------

    context_parts = []

    for index, document in enumerate(documents, start=1):

        source_path = Path(
            document.metadata.get("source", "unknown.md")
        )

        source_name = source_path.name

        context_parts.append(
            f"[{index}] {source_name}\n"
            f"{document.page_content}"
        )

    context = "\n\n".join(context_parts)

    # -----------------------------------------------------
    # Prompt
    # -----------------------------------------------------

    prompt = f"""
You are an internal helpdesk assistant.

Your task is to draft a helpful response to an employee's
support ticket using ONLY the provided knowledge-base context.

IMPORTANT RULES:

1. Use only information contained in the provided knowledge base.
2. Do not invent policies, procedures, instructions, or facts.
3. Do not assume information that is not present in the KB.
4. If the KB does not contain enough relevant information to answer
   the ticket, clearly state that no relevant knowledge-base article
   was found.
5. Keep the response professional, helpful, and concise.
6. Do not mention that you are an AI.
7. Do not claim that an action has already been performed.
8. Select citations only from the provided sources.
9. Return ONLY valid JSON.

EMPLOYEE TICKET

Title:
{title}

Description:
{description}


KNOWLEDGE BASE

{context}


RETURN EXACTLY THIS JSON FORMAT:

{{
    "draft": "Your response to the employee",
    "citations": [1]
}}

The citations must contain only the source numbers from the
knowledge-base context.
"""

    # -----------------------------------------------------
    # Groq request
    # -----------------------------------------------------

    completion = client.chat.completions.create(
        model="qwen/qwen3.8-27b",
        messages=[
            {
                "role": "user",
                "content": prompt,
            }
        ],
        temperature=0,
        max_completion_tokens=500,
        top_p=1,
        stream=False,
    )

    content = completion.choices[0].message.content

    # -----------------------------------------------------
    # Parse LLM response
    # -----------------------------------------------------

    try:
        result = json.loads(content)

    except (json.JSONDecodeError, TypeError):

        return {
            "draft": (
                "Unable to generate a grounded response "
                "from the knowledge base."
            ),
            "citations": [],
            "documents": documents,
        }

    # -----------------------------------------------------
    # Validate citations
    # -----------------------------------------------------

    raw_citations = result.get("citations", [])

    valid_citations = []

    if isinstance(raw_citations, list):

        for citation in raw_citations:

            if (
                isinstance(citation, int)
                and 1 <= citation <= len(documents)
            ):
                valid_citations.append(citation)

    # -----------------------------------------------------
    # Deduplicate citations by source file
    # -----------------------------------------------------

    unique_citations = []
    seen_sources = set()

    for citation in valid_citations:

        document = documents[citation - 1]

        source_path = Path(
            document.metadata.get("source", "unknown.md")
        )

        source_name = source_path.name

        if source_name in seen_sources:
            continue

        seen_sources.add(source_name)

        # Improve display title
        title_name = source_path.stem.replace("_", " ").title()

        unique_citations.append(
            {
                "title": title_name,
                "source": source_name,
            }
        )

    # -----------------------------------------------------
    # Final response
    # -----------------------------------------------------

    draft = result.get("draft")

    if not isinstance(draft, str) or not draft.strip():

        draft = (
            "No relevant knowledge-base article was found "
            "for this issue."
        )

    return {
        "draft": draft.strip(),
        "citations": unique_citations,
        "documents": documents,
    }