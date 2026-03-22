"use client";
import React, { useState, useEffect, useRef, JSX } from "react";
import styles from "./NCTACPage.module.css";

type Locale = "en" | "vi";

type Suggestion = { icon: string; text: string };

type LocalizedStrings = {
  badge: string;
  welcomeTitle: string;
  welcomeSub: string;
  inputPlaceholder: string;
  newChat: string;
  quickTopics: string;
  recent: string;
  disclaimer: string;
  typingLabel: string;
  emptyHint: string;
  topics: string[];
  suggestions: Suggestion[];
};

const UI: Record<Locale, LocalizedStrings> = {
  en: {
    badge: "Admissions Advisor",
    welcomeTitle: "Hello, I'm NCT-AC",
    welcomeSub:
      "Your personal admissions consultant — guiding you through university applications, scholarships, essays, and more.",
    inputPlaceholder: "Ask about universities, essays, scholarships, visas...",
    newChat: "New Consultation",
    quickTopics: "Quick Topics",
    recent: "Recent",
    disclaimer:
      "NCT-AC provides guidance only. Always verify with official university sources.",
    typingLabel: "NCT-AC is thinking...",
    emptyHint: "Start by asking a question below or pick a topic",
    topics: [
      "US Universities",
      "UK Admissions",
      "Scholarships",
      "Essays & Personal Statement",
      "SAT / IELTS Scores",
      "Vietnamese Students",
      "Application Deadlines",
      "Student Visa",
    ],
    suggestions: [
      {
        icon: "🎓",
        text: "What universities should I apply to with a 3.8 GPA and 1450 SAT?",
      },
      { icon: "✍️", text: "Help me write my Common App personal statement" },
      {
        icon: "💰",
        text: "What scholarships are available for international students?",
      },
      {
        icon: "📋",
        text: "What are the IELTS requirements for UK universities?",
      },
      {
        icon: "🏛️",
        text: "What is the difference between Early Decision and Early Action?",
      },
      {
        icon: "🗺️",
        text: "What is the step-by-step process to apply to US universities?",
      },
    ],
  },
  vi: {
    badge: "Tư vân Tuyển Sinh",
    welcomeTitle: "Xin chào, tôi là NCT-AC",
    welcomeSub:
      "Your personal admissions consultant — guiding you through university applications, scholarships, essays, and more.",
    inputPlaceholder: "Hỏi về trường đại học, bài luận, học bổng, visa...",
    newChat: "Cuộc trò chuyện mới",
    quickTopics: "Chủ đê nhanh",
    recent: "Gân đây",
    disclaimer:
      "NCT-AC chỉ cung cấp tư vấn. Vui lòng xác minh với nguồn chính thức của trường.",
    typingLabel: "NCT-AC đang soạn câu trả lời...",
    emptyHint: "Bắt đầu bằng cách đặt câu hỏi hoặc chọn một chủ đề bên dưới",
    topics: [
      "Đại học Mỹ",
      "Tuyển sinh Anh",
      "Học bổng",
      "Bài luận & Personal Statement",
      "Điểm SAT / IELTS",
      "Học sinh Việt Nam",
      "Hạn chót nộp hồ sơ",
      "Visa du học",
    ],
    suggestions: [
      {
        icon: "🎓",
        text: "Tôi có GPA 3.8 và SAT 1450, nên nộp vào trường nào?",
      },
      {
        icon: "✍️",
        text: "Giúp tôi viết bài luận Common App (personal statement)",
      },
      {
        icon: "💰",
        text: "Có những học bổng nào dành cho du học sinh Việt Nam?",
      },
      {
        icon: "📋",
        text: "Yêu cầu IELTS để vào các trường đại học Anh là bao nhiêu?",
      },
      {
        icon: "🏛️",
        text: "Early Decision và Early Action khác nhau như thế nào?",
      },
      {
        icon: "🗺️",
        text: "Quy trình từng bước để nộp hồ sơ vào đại học Mỹ là gì?",
      },
    ],
  },
};

type Message = { role: "user" | "assistant"; content: string; id: number };
type ChatHistoryItem = { id: number; title: string };

export default function NCTACPage(): JSX.Element {
  const [lang, setLang] = useState<Locale>("vi"); // default Vietnamese
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const t = UI[lang]; // current language strings

  useEffect(() => {
    initSession();
     
  }, []);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function initSession(): Promise<void> {
    try {
      const res = await fetch("https://nct-ac-1.onrender.com/api/session/new", {
        method: "POST",
      });
      const data = await res.json();
      setSessionId(data.session_id);
    } catch {
      setSessionId("offline-" + Date.now());
    }
  }

  async function ensureSession(): Promise<string> {
    let sid = sessionId;
    if (!sid || sid.startsWith("offline-")) {
      try {
        const res = await fetch("https://nct-ac-1.onrender.com/api/session/new", {
          method: "POST",
        });
        sid = (await res.json()).session_id;
        setSessionId(sid);
      } catch {
        sid = "offline-" + Date.now();
        setSessionId(sid);
      }
    }
    return sid as string;
  }

  async function sendMessage(text?: string): Promise<void> {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    const sid = await ensureSession();
    const userMsg: Message = { role: "user", content: msg, id: Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    if (messages.length === 0) {
      setChatHistory((prev) => [
        {
          id: Date.now(),
          title: msg.slice(0, 42) + (msg.length > 42 ? "…" : ""),
        },
        ...prev.slice(0, 9),
      ]);
    }

    try {
      const res = await fetch("https://nct-ac-1.onrender.com", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sid, message: msg }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.reply || data.error,
          id: Date.now() + 1,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            lang === "vi"
              ? "⚠️ Không thể kết nối tới máy chủ NCT-AC. Hãy chắc chắn `python server.py` đang chạy trên cổng 5001."
              : "⚠️ Cannot connect to NCT-AC server. Make sure `python server.py` is running on port 5001.",
          id: Date.now() + 1,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function newChat(): void {
    setMessages([]);
    initSession();
    setTimeout(() => inputRef.current?.focus(), 100);
  }

  function handleInput(e: React.ChangeEvent<HTMLTextAreaElement>): void {
    setInput(e.target.value);
    const ta = e.target;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 140) + "px";
  }

  const isEmpty = messages.length === 0;

  return (
    <div className={styles.root}>
      {/* ── SIDEBAR ── */}
      <aside
        className={`${styles.sidebar} ${sidebarOpen ? styles.open : styles.closed}`}
      >
        <div className={styles.sidebarHeader}>
          <div className={styles.brand}>
            <div className={styles.brandLogo}>
              <span className={styles.brandInitials}>NC</span>
            </div>
            {sidebarOpen && (
              <div>
                <div className={styles.brandName}>NCT-AC</div>
                <div className={styles.brandTagline}>
                  {lang === "vi" ? "Tư Vấn Tuyển Sinh" : "Admissions Advisor"}
                </div>
              </div>
            )}
          </div>
          <button
            className={styles.collapseBtn}
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? "‹" : "›"}
          </button>
        </div>

        {sidebarOpen && (
          <>
            {/* Language toggle */}
            <div className={styles.langToggle}>
              <button
                className={`${styles.langBtn} ${lang === "vi" ? styles.langActive : ""}`}
                onClick={() => setLang("vi")}
              >
                Vietnamese
              </button>
              <button
                className={`${styles.langBtn} ${lang === "en" ? styles.langActive : ""}`}
                onClick={() => setLang("en")}
              >
                English
              </button>
            </div>

            <button className={styles.newChatBtn} onClick={newChat}>
              <span className={styles.newChatIcon}>+</span>
              {t.newChat}
            </button>

            <div className={styles.topicsSection}>
              <p className={styles.sectionLabel}>{t.quickTopics}</p>
              <div className={styles.topicGrid}>
                {t.topics.map((topic, i) => (
                  <button
                    key={i}
                    className={styles.topicChip}
                    onClick={() =>
                      sendMessage(
                        lang === "vi"
                          ? `Tư vấn cho tôi về: ${topic}`
                          : `Tell me about: ${topic}`,
                      )
                    }
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </div>

            {chatHistory.length > 0 && (
              <div className={styles.historySection}>
                <p className={styles.sectionLabel}>{t.recent}</p>
                {chatHistory.map((h) => (
                  <button key={h.id} className={styles.historyItem}>
                    <span className={styles.historyDot} />
                    <span className={styles.historyTitle}>{h.title}</span>
                  </button>
                ))}
              </div>
            )}

            <div className={styles.sidebarFooter}>
              <div className={styles.statusBadge}>
                <span className={styles.statusDot} />
                <span>llama-3.3-70b · Groq</span>
              </div>
            </div>
          </>
        )}
      </aside>

      {/* ── MAIN ── */}
      <main className={styles.main}>
        {/* Top bar */}
        <div className={styles.topBar}>
          <div className={styles.topBarLeft}>
            <div className={styles.topBarTitle}>NCT-AC</div>
            <div className={styles.topBarSub}>{t.badge}</div>
          </div>
          {/* Inline lang toggle for when sidebar is collapsed */}
          {!sidebarOpen && (
            <div className={styles.topBarLang}>
              <button
                className={`${styles.topLangBtn} ${lang === "vi" ? styles.topLangActive : ""}`}
                onClick={() => setLang("vi")}
              >
                Vietnamese
              </button>
              <button
                className={`${styles.topLangBtn} ${lang === "en" ? styles.topLangActive : ""}`}
                onClick={() => setLang("en")}
              >
                English
              </button>
            </div>
          )}
        </div>

        {/* Chat area */}
        <div className={styles.chatArea}>
          {isEmpty ? (
            <div className={styles.welcome}>
              <div className={styles.welcomeBadge}>{t.badge}</div>
              <h1 className={styles.welcomeTitle}>
                {lang === "vi" ? (
                  <>
                    Xin chào, tôi là{" "}
                    <span className={styles.accentText}>NCT-AC</span>
                  </>
                ) : (
                  <>
                    Hello, I&apos;m{" "}
                    <span className={styles.accentText}>NCT-AC</span>
                  </>
                )}
              </h1>
              <p className={styles.welcomeSub}>{t.welcomeSub}</p>
              <div className={styles.suggestions}>
                {t.suggestions.map((s, i) => (
                  <button
                    key={i}
                    className={styles.suggCard}
                    onClick={() => sendMessage(s.text)}
                    style={{ animationDelay: `${i * 0.07}s` }}
                  >
                    <span className={styles.suggIcon}>{s.icon}</span>
                    <span className={styles.suggText}>{s.text}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className={styles.messages}>
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`${styles.msgRow} ${m.role === "user" ? styles.userRow : styles.botRow}`}
                >
                  {m.role === "assistant" && (
                    <div className={styles.botAvatar}>
                      <span>NC</span>
                    </div>
                  )}
                  <div
                    className={`${styles.bubble} ${m.role === "user" ? styles.userBubble : styles.botBubble}`}
                  >
                    {(m.content || "").split("\n").map((line, i) => (
                      <span key={i}>
                        {line}
                        <br />
                      </span>
                    ))}
                  </div>
                  {m.role === "user" && (
                    <div className={styles.userAvatar}>
                      {lang === "vi" ? "Bạn" : "You"}
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div className={`${styles.msgRow} ${styles.botRow}`}>
                  <div className={styles.botAvatar}>
                    <span>NC</span>
                  </div>
                  <div
                    className={`${styles.bubble} ${styles.botBubble} ${styles.typingBubble}`}
                  >
                    <span className={styles.dot} />
                    <span className={styles.dot} />
                    <span className={styles.dot} />
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <div className={styles.inputSection}>
          <div className={styles.inputBox}>
            <textarea
              ref={(el) => {
                inputRef.current = el;
                textareaRef.current = el;
              }}
              className={styles.input}
              placeholder={t.inputPlaceholder}
              value={input}
              rows={1}
              onChange={handleInput}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
            />
            <button
              className={`${styles.sendBtn} ${input.trim() && !loading ? styles.sendReady : ""}`}
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path
                  d="M22 2L11 13"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M22 2L15 22L11 13L2 9L22 2Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
          <p className={styles.inputHint}>{t.disclaimer}</p>
        </div>
      </main>
    </div>
  );
}
