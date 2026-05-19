"use client";
import { useState, useRef, useEffect } from "react";

type Message = { role: "user" | "assistant"; content: string };

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Salut ! 👋 Je suis ton coach IA AthletIQ. Pose-moi une question sur ton entraînement, ta récupération ou ta nutrition. J'ai accès à toutes tes données !" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg, conversationId }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [...prev, { role: "assistant", content: data.response }]);
        if (data.conversationId) setConversationId(data.conversationId);
      } else {
        setMessages((prev) => [...prev, { role: "assistant", content: "❌ Erreur de connexion au coach IA. Réessaye dans un instant." }]);
      }
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "❌ Erreur réseau. Vérifie ta connexion." }]);
    }

    setLoading(false);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>🤖 Coach IA</h1>
        {conversationId && (
          <button
            onClick={() => { setMessages([{ role: "assistant", content: "Nouvelle conversation ! Comment je peux t'aider ? 💪" }]); setConversationId(null); }}
            className="text-xs px-3 py-1.5 rounded-lg transition"
            style={{ border: "1px solid var(--color-border)", color: "var(--color-text-muted)" }}
          >
            + Nouvelle conversation
          </button>
        )}
      </div>
      <div className="flex-1 overflow-auto space-y-4 pb-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className="max-w-[80%] p-4 rounded-2xl text-sm whitespace-pre-wrap" style={{
              background: msg.role === "user" ? "var(--color-accent)" : "var(--color-surface)",
              border: msg.role === "assistant" ? "1px solid var(--color-border)" : "none",
              color: msg.role === "user" ? "white" : "var(--color-text)",
              borderRadius: msg.role === "user" ? "20px 20px 4px 20px" : "20px 20px 20px 4px",
            }}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="p-4 rounded-2xl" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "20px 20px 20px 4px" }}>
              <div className="flex gap-1.5">
                <span className="w-2 h-2 rounded-full animate-bounce" style={{ background: "var(--color-accent)", animationDelay: "0ms" }}></span>
                <span className="w-2 h-2 rounded-full animate-bounce" style={{ background: "var(--color-accent)", animationDelay: "150ms" }}></span>
                <span className="w-2 h-2 rounded-full animate-bounce" style={{ background: "var(--color-accent)", animationDelay: "300ms" }}></span>
              </div>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>
      <div className="flex gap-3 pt-4 border-t" style={{ borderColor: "var(--color-border)" }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
          placeholder="Demande un conseil à ton coach..."
          className="flex-1 px-4 py-3 rounded-xl text-sm outline-none"
          style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", color: "var(--color-text)" }}
        />
        <button onClick={send} disabled={loading || !input.trim()} className="px-6 py-3 rounded-xl font-medium text-white transition disabled:opacity-50" style={{ background: "var(--color-accent)" }}>
          Envoyer
        </button>
      </div>
    </div>
  );
}
