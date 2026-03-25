"""
NCT-AC Flask API Server
Admissions Consulting Chatbot — Groq Free Tier
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from chatbot import NCTAC
import uuid
import os

app = Flask(__name__)
CORS(app, 
     origins=["https://nct-ac-pbvl.vercel.app", "https://illustrious-halva-071dbe.netlify.app"],
     methods=["GET", "POST", "OPTIONS"],
     allow_headers=["Content-Type"])
sessions = {}
@app.before_request
def handle_options():
    if request.method == "OPTIONS":
        return "", 200

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
@app.route("/api/debug", methods=["GET"])
def debug():
    key = os.environ.get("GROQ_API_KEY", "NOT FOUND")
    return jsonify({"key_found": key != "NOT FOUND", "key_prefix": key[:8] if key != "NOT FOUND" else "none"})
if __name__ == "__main__":
    print("NCT-AC API running at https://nct-ac-1.onrender.com")
    port = int(os.environ.get("PORT", 5001))
    app.run(debug=False, host="0.0.0.0", port=port)