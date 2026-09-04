import os
import re
import boto3
from dotenv import load_dotenv

load_dotenv()

# Bedrock Runtime client
bedrock_client = boto3.client(
    service_name="bedrock-runtime",
    region_name=os.getenv("AWS_REGION"),
)

MODEL_ID = os.getenv("MODEL_ID", "amazon.nova-lite-v1:0")


def get_ai_recommendations(
    days: int,
    destination: str,
    budget: float,
    travel_style: str,
) -> str:
    """
    Generate a structured travel itinerary using Amazon Bedrock.

    Args:
        days: Number of days for the trip.
        destination: Travel destination.
        budget: Total budget in USD.
        travel_style: Preferred travel style (e.g. adventure, luxury, budget).

    Returns:
        A raw JSON string matching the required itinerary schema.
    """
    prompt = (
        f"You are an experienced travel planner. Plan a {days}-day itinerary for {destination}.\n\n"
        f"Budget: USD {budget}\n"
        f"Travel Style: {travel_style}\n\n"
        f"Respond ONLY with a single valid JSON object — no explanation, no markdown code block, no extra text.\n\n"
        f"The JSON must follow this exact schema:\n"
        f'{{\n'
        f'  "itinerary": [\n'
        f'    {{"day": "Day 1", "activities": "..."}},\n'
        f'    {{"day": "Day 2", "activities": "..."}}\n'
        f'  ],\n'
        f'  "travel_tips": ["...", "..."],\n'
        f'  "local_food": ["...", "..."],\n'
        f'  "budget_breakdown": {{\n'
        f'    "accommodation": 0,\n'
        f'    "food": 0,\n'
        f'    "transport": 0,\n'
        f'    "total": 0\n'
        f'  }}\n'
        f'}}\n\n'
        f"Rules for the text values inside the JSON:\n"
        f"- Use **bold** (double asterisks) for emphasis on important names or highlights.\n"
        f"- Use '-' at the start of a line for bullet points.\n"
        f"- Use \\n for line breaks within a string value.\n"
        f"- The 'itinerary' array must contain exactly {days} objects, one per day.\n"
        f"- 'budget_breakdown' values must be numbers (USD), and 'total' must equal the sum of the others.\n"
        f"- Do NOT wrap the output in ```json or any other markdown. Return pure JSON only."
    )

    # Converse API — model-agnostic, works with Nova, Claude, Llama, etc.
    response = bedrock_client.converse(
        modelId=MODEL_ID,
        messages=[
            {
                "role": "user",
                "content": [{"text": prompt}],
            }
        ],
    )

    raw: str = response["output"]["message"]["content"][0]["text"]

    # Strip any accidental ```json ... ``` wrapping the model might still add
    clean = re.sub(r"^```(?:json)?\s*", "", raw.strip())
    clean = re.sub(r"\s*```$", "", clean.strip())

    return clean.strip()


def get_chat_response(messages: list) -> str:
    """
    Send a full conversation history to Amazon Bedrock and return the
    AI reply as a plain string.

    This function is context-aware — it forwards the complete message
    history so the model can refer to any prior turn in the conversation,
    not just the most recent message.

    Args:
        messages: List of Message ORM objects ordered oldest → newest.
                  Each object must expose .role ("user" | "assistant")
                  and .content (str).

    Returns:
        The assistant's reply text.

    Bedrock Converse message format expected:
        [
            {"role": "user",      "content": [{"text": "..."}]},
            {"role": "assistant", "content": [{"text": "..."}]},
            ...
        ]

    Note: The Converse API requires the turns to alternate strictly
    (user → assistant → user → ...) and the first turn must be "user".
    This is guaranteed as long as messages are saved correctly by the
    caller (send_message endpoint).
    """
    # Build the array expected by the Bedrock Converse API
    bedrock_messages = [
        {
            "role":    msg.role,
            "content": [{"text": msg.content}],
        }
        for msg in messages
    ]

    response = bedrock_client.converse(
        modelId=MODEL_ID,
        messages=bedrock_messages,
    )

    return response["output"]["message"]["content"][0]["text"]
