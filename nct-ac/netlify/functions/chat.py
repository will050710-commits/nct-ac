import os
import json
from chatbot import NCTAC


def _cors_headers():
    return {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Content-Type": "application/json",
    }


def handler(event, context):
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": _cors_headers(), "body": ""}

    if event.get("httpMethod") != "POST":
        return {"statusCode": 405, "headers": _cors_headers(), "body": json.dumps({"error": "Only POST allowed"})}

    try:
        body = json.loads(event.get("body") or "{}")
        message = (body.get("message") or "").strip()
        conversation_history = body.get("conversation_history", [])
        if not message:
            return {"statusCode": 400, "headers": _cors_headers(), "body": json.dumps({"error": "message required"})}

        api_key = os.getenv("GROQ_API_KEY")
        bot = NCTAC(api_key=api_key)
        # Accept client-provided conversation history (stateless serverless function)
        if isinstance(conversation_history, list):
            bot.conversation_history = conversation_history

        reply = bot.chat(message)

        return {
            "statusCode": 200,
            "headers": _cors_headers(),
            "body": json.dumps({"reply": reply, "conversation_history": bot.get_history()}),
        }

    except Exception as e:
        return {"statusCode": 500, "headers": _cors_headers(), "body": json.dumps({"error": str(e)})}
