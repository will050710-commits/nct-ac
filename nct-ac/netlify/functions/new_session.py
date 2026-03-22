import json
import uuid


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

    if event.get("httpMethod") not in ("GET", "POST"):
        return {"statusCode": 405, "headers": _cors_headers(), "body": json.dumps({"error": "Only GET/POST allowed"})}

    sid = str(uuid.uuid4())
    return {"statusCode": 200, "headers": _cors_headers(), "body": json.dumps({"session_id": sid, "conversation_history": []})}
