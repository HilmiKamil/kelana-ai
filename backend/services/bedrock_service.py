import os
import json
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
    Generate a travel itinerary using Amazon Bedrock.

    Args:
        days: Number of days for the trip.
        destination: Travel destination.
        budget: Total budget in USD.
        travel_style: Preferred travel style (e.g. adventure, luxury, budget).

    Returns:
        Generated itinerary text from the model.
    """
    prompt = (
        f"You are an experienced travel planner. Plan a {days}-day itinerary for {destination}.\n\n"
        f"Budget: USD {budget}\n"
        f"Travel Style: {travel_style}\n\n"
        f"Please provide the following for each day:\n"
        f"- A detailed daily itinerary structured into three parts:\n"
        f"  - Morning: 2-3 morning activities (e.g. sightseeing, outdoor adventures, or local experiences)\n"
        f"  - Afternoon: cultural sites and experiences to explore\n"
        f"  - Evening: dinner spots and nightlife recommendations\n"
        f"- Estimated daily budget breakdown (accommodation, food, transport, activities)\n"
        f"- Local food recommendations including must-try dishes and restaurants\n"
        f"- Transportation suggestions for getting around within {destination}\n\n"
        f"Format your response as Markdown with headers (##) and bullet lists (-)."
    )

    # Converse API — works across Nova, Claude, Llama, and other Bedrock models
    response = bedrock_client.converse(
        modelId=MODEL_ID,
        messages=[
            {
                "role": "user",
                "content": [{"text": prompt}],
            }
        ],
    )

    # Extract the assistant's reply text
    itinerary: str = response["output"]["message"]["content"][0]["text"]
    return itinerary
