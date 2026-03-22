"use client";
import { useState, useEffect, useRef } from "react";
import styles from "./NCTACSidebar.module.css";

/**
 * NCTACSidebar
 * Drop into ANY Next.js page to get a sliding admissions chatbot from the right.
 *
 * Usage:
 *   import NCTACSidebar from "@/components/NCTAC/NCTACSidebar";
 *   <NCTACSidebar />
 */
export default function NCTACSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { initSession(); }, []);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);
  useEffect(() => { if (isOpen) setTimeout(() => inputRef.current?.focus(), 360); }, [isOpen]);

  async function initSession() {
    try {
      const res = await fetch("http://localhost:5001/api/session/new", { method: "POST" });
      const data = await res.json();
      setSessionId(data.session_id);
    } catch { setSessionId("offline-" + Date.now()); }
  }

  async function ensureSession() {
    let sid = sessionId;
    if (!sid || sid.startsWith("offline-")) {
      try {
        const res = await fetch("http://localhost:5001/api/session/new", { method: "POST" });
        sid = (await res.json()).session_id;
        setSessionId(sid);
      } catch { sid = "offline-" + Date.now(); setSessionId(sid); }
    }
    return sid;
  }

  async function sendMessage() {
    const msg = input.trim();
    if (!msg || loading) return;
    setInput("");
    const sid = await ensureSession();
    setMessages(p => [...p, { role: "user", content: msg, id: Date.now() }]);
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5001/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sid, message: msg }),
      });
      const data = await res.json();
      setMessages(p => [...p, { role: "assistant", content: data.reply || data.error, id: Date.now() + 1 }]);
    } catch {
      setMessages(p => [...p, { role: "assistant", content: "⚠️ Server offline. Run `python server.py`.", id: Date.now() + 1 }]);
    } finally { setLoading(false); }
  }

  return (
    <>
      {/* FAB */}
      <button
        className={`${styles.fab} ${isOpen ? styles.fabHidden : ""}`}
        onClick={() => setIsOpen(true)}
        title="NCT-AC Admissions Advisor"
      >
        <span className={styles.fabLogo}>NC</span>
        <span className={styles.fabLabel}>Admissions Help</span>
      </button>

      {/* Backdrop */}
      {isOpen && <div className={styles.backdrop} onClick={() => setIsOpen(false)} />}

      {/* Panel */}
      <div className={`${styles.panel} ${isOpen ? styles.panelOpen : ""}`}>
        <div className={styles.panelHeader}>
          <div className={styles.panelBrand}>
            <div className={styles.panelLogo}><span>NC</span></div>
            <div>
              <div className={styles.panelName}>NCT-AC</div>
              <div className={styles.panelSub}>Admissions Consultant</div>
            </div>
          </div>
          <div className={styles.panelActions}>
            <button className={styles.iconBtn} onClick={() => { setMessages([]); initSession(); }} title="New chat">✏</button>
            <button className={styles.iconBtn} onClick={() => setIsOpen(false)} title="Close">✕</button>
          </div>
        </div>

        <div className={styles.messages}>
          {messages.length === 0 && (
            <div className={styles.empty}>
              <div className={styles.emptyLogo}>NC</div>
              <p>Ask me about university admissions, scholarships, essays, or visas.</p>
              <p className={styles.emptyVI}>Hỏi tôi về tuyển sinh đại học, học bổng, bài luận hoặc visa.</p>
            </div>
          )}
          {messages.map(m => (
            <div key={m.id} className={`${styles.msgRow} ${m.role === "user" ? styles.userRow : styles.botRow}`}>
              {m.role === "assistant" && <div className={styles.avatar}><span>NC</span></div>}
              <div className={`${styles.bubble} ${m.role === "user" ? styles.userBubble : styles.botBubble}`}>
                {(m.content || "").split("\n").map((line, i) => <span key={i}>{line}<br /></span>)}
              </div>
            </div>
          ))}
          {loading && (
            <div className={`${styles.msgRow} ${styles.botRow}`}>
              <div className={styles.avatar}><span>NC</span></div>
              <div className={`${styles.bubble} ${styles.botBubble} ${styles.typing}`}>
                <span /><span /><span />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className={styles.inputArea}>
          <input
            ref={inputRef}
            className={styles.input}
            placeholder="Ask about admissions..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && sendMessage()}
          />
          <button
            className={`${styles.sendBtn} ${input.trim() && !loading ? styles.sendReady : ""}`}
            onClick={sendMessage}
            disabled={!input.trim() || loading}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
              <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    </>
  );
}
