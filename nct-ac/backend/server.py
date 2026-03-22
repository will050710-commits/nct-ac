"""
NCT-AC Flask API Server
Admissions Consulting Chatbot — Groq Free Tier
"""

from flask import Flask, request, jsonify # type: ignore
from flask_cors import CORS # type: ignore
from chatbot import NCTAC # type: ignore
import uuid

app = Flask(__name__)
CORS(app)

sessions = {}

def get_session(session_id: str) -> NCTAC:
    if session_id not in sessions:
        sessions[session_id] = NCTAC()
    return sessions[session_id]


@app.route("/api/session/new", methods=["POST"])
def new_session():
    sid = str(uuid.uuid4())
    sessions[sid] = NCTAC()
    return jsonify({"session_id": sid})


@app.route("/api/chat", methods=["POST"])
def chat():
    data = request.get_json()
    sid = data.get("session_id")
    message = data.get("message", "").strip()
    if not sid or not message:
        return jsonify({"error": "session_id and message required"}), 400
    try:
        bot = get_session(sid)
        reply = bot.chat(message)
        return jsonify({"reply": reply, "session_id": sid})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/session/<sid>/reset", methods=["POST"])
def reset(sid):
    if sid in sessions:
        sessions[sid].reset()
        return jsonify({"message": "Reset successful"})
    return jsonify({"error": "Session not found"}), 404


@app.route("/api/session/<sid>/history", methods=["GET"])
def history(sid):
    if sid in sessions:
        return jsonify({"history": sessions[sid].get_history()})
    return jsonify({"error": "Session not found"}), 404


@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "bot": "NCT-AC", "model": "llama-3.3-70b-versatile"})


if __name__ == "__main__":
    print("NCT-AC API running at https://nct-ac-1.onrender.com")
    app.run(debug=True, host="0.0.0.0", port=5001)
