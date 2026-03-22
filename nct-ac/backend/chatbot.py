"""
NCT-AC — Admissions Consulting Chatbot
Backend: Python + Groq API (llama-3.3-70b-versatile) — FREE tier
Get your free API key at: https://console.groq.com
"""

import os
import json
from groq import Groq # type: ignore

# ─────────────────────────────────────────────
# Configuration
# ─────────────────────────────────────────────

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "your-groq-api-key-here")
MODEL = "llama-3.3-70b-versatile"
MAX_TOKENS = 2048

SYSTEM_PROMPT = """
You are NCT-AC (NCT Admissions Consultant) — a professional, warm, and knowledgeable university admissions consulting chatbot.

## Your Expertise
1. **University Admissions**: US, UK, Australia, Canada, Singapore, and Vietnamese universities.
2. **Application Strategy**: Personal statements, essays, extracurriculars, recommendation letters.
3. **Scholarships & Financial Aid**: Merit-based, need-based, country-specific scholarships.
4. **Standardized Tests**: SAT, ACT, IELTS, TOEFL, GRE, GMAT — scores, prep tips, waiver options.
5. **Major & Career Guidance**: Matching student interests/strengths with suitable programs and careers.
6. **Visa & Immigration**: Student visa requirements for major study destinations.
7. **Vietnamese Students**: Specialized knowledge of Vietnamese high school system, GPA conversion, national exam (THPT), and top Vietnamese universities (VNU, HCMUT, NEU, FTU, etc.).

## Personality & Tone
- Professional yet warm and encouraging — like a trusted mentor.
- Always acknowledge the student's situation before giving advice.
- Be specific: give real university names, deadlines, score ranges, and requirements.
- When uncertain, say so honestly and suggest where to verify.
- Celebrate achievements and reassure students about challenges.

## Language Rules
- Auto-detect the user's language (Vietnamese or English).
- Vietnamese input → respond primarily in Vietnamese.
- English input → respond in English.
- Always be ready to switch languages on request.

## Response Format
- Use **bold** for university names, deadlines, and key terms.
- Use numbered lists for step-by-step processes.
- Use bullet points for requirements and options.
- End responses with a relevant follow-up question to keep the conversation going.
- For essay/personal statement help: provide specific, actionable feedback.

## Important Boundaries
- You are an advisor, not a guarantee. Always remind students to verify with official sources.
- Never fabricate specific acceptance rates or scholarship amounts without noting uncertainty.
- Encourage students to also consult official university websites and counselors.
"""

# ─────────────────────────────────────────────
# Intent Detection
# ─────────────────────────────────────────────

INTENT_KEYWORDS = {
    "essay":        ["essay", "personal statement", "bai luan", "writing", "viet luan", "common app"],
    "scholarship":  ["scholarship", "hoc bong", "financial aid", "funding", "tro cap", "merit"],
    "university":   ["university", "college", "truong", "dai hoc", "apply", "nop ho so", "admission"],
    "test":         ["sat", "act", "ielts", "toefl", "gre", "gmat", "score", "diem", "exam", "thi"],
    "visa":         ["visa", "immigration", "student visa", "i-20", "cas", "du hoc"],
    "major":        ["major", "nganh", "career", "nghe nghiep", "program", "chuyen nganh", "study"],
    "deadline":     ["deadline", "han chot", "when", "khi nao", "timeline", "schedule", "lich"],
    "vietnam":      ["vnu", "hcmut", "neu", "ftu", "thpt", "diem chuan", "xet tuyen", "dai hoc viet"],
}

def detect_intent(message: str) -> str:
    msg_lower = message.lower()
    for intent, keywords in INTENT_KEYWORDS.items():
        if any(kw in msg_lower for kw in keywords):
            return intent
    return "general"

INTENT_PREFIXES = {
    "essay": (
        "The student needs help with a college application essay or personal statement. "
        "Provide specific, actionable writing advice. Ask about their topic if not mentioned. "
        "Offer to review drafts and give detailed feedback on structure, story, and impact. "
        "Request: {msg}"
    ),
    "scholarship": (
        "The student is asking about scholarships or financial aid. "
        "Provide specific scholarship names, amounts (if known), eligibility criteria, and deadlines. "
        "Include both merit-based and need-based options relevant to their situation. "
        "Request: {msg}"
    ),
    "university": (
        "The student is asking about university admissions. "
        "Provide specific information about admission requirements, deadlines, acceptance rates (approximate), "
        "and application tips. Include safety, match, and reach school suggestions if helpful. "
        "Request: {msg}"
    ),
    "test": (
        "The student is asking about standardized tests. "
        "Provide target score ranges for their mentioned universities, preparation strategies, "
        "test dates, registration info, and whether test-optional policies apply. "
        "Request: {msg}"
    ),
    "visa": (
        "The student is asking about student visa requirements. "
        "Provide step-by-step visa application process, required documents, timelines, "
        "and common pitfalls to avoid. Be specific about the destination country. "
        "Request: {msg}"
    ),
    "major": (
        "The student is asking about choosing a major or career path. "
        "Help them explore options based on their interests and strengths. "
        "Suggest related programs, top universities for that field, and career outcomes. "
        "Request: {msg}"
    ),
    "deadline": (
        "The student is asking about application deadlines or timelines. "
        "Provide a clear timeline with specific dates for Early Decision, Early Action, "
        "Regular Decision, and rolling admissions. Note that dates may vary by year. "
        "Request: {msg}"
    ),
    "vietnam": (
        "The student is asking about Vietnamese university admissions or studying from Vietnam. "
        "Provide information about the Vietnamese admission system, score benchmarks, "
        "top universities, and any specific scholarships for Vietnamese students. "
        "Request: {msg}"
    ),
    "general": "{msg}",
}

# ─────────────────────────────────────────────
# NCT-AC Core Class
# ─────────────────────────────────────────────

class NCTAC:
    def __init__(self, api_key: str = GROQ_API_KEY):
        self.client = Groq(api_key=api_key)
        self.conversation_history = []
        self.model = MODEL

    def chat(self, user_message: str) -> str:
        intent = detect_intent(user_message)
        prefix_template = INTENT_PREFIXES.get(intent, "{msg}")
        processed = prefix_template.format(msg=user_message)

        self.conversation_history.append({
            "role": "user",
            "content": processed
        })

        response = self.client.chat.completions.create(
            model=self.model,
            max_tokens=MAX_TOKENS,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                *self.conversation_history
            ]
        )

        reply = response.choices[0].message.content
        self.conversation_history.append({
            "role": "assistant",
            "content": reply
        })
        return reply

    def reset(self):
        self.conversation_history = []

    def get_history(self):
        return self.conversation_history

    def export_session(self, path="nctac_session.json"):
        with open(path, "w", encoding="utf-8") as f:
            json.dump(self.conversation_history, f, ensure_ascii=False, indent=2)
        return f"Session saved to {path}"


# ─────────────────────────────────────────────
# CLI
# ─────────────────────────────────────────────

if __name__ == "__main__":
    print("=" * 60)
    print("  NCT-AC — Admissions Consulting Chatbot")
    print("  Powered by Groq (llama-3.3-70b) — Free Tier")
    print("  Type 'quit' | 'reset' | 'export'")
    print("=" * 60)

    bot = NCTAC()
    while True:
        try:
            user_input = input("\nYou: ").strip()
            if not user_input:
                continue
            if user_input.lower() == "quit":
                break
            elif user_input.lower() == "reset":
                bot.reset()
                print("Conversation reset.")
            elif user_input.lower() == "export":
                print(bot.export_session())
            else:
                print("\nNCT-AC:", bot.chat(user_input))
        except KeyboardInterrupt:
            break
