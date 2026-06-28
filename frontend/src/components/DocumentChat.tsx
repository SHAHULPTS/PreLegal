"use client";

import { useEffect, useRef, useState } from "react";
import { api, ApiError, type ChatMessage } from "@/lib/api";
import type { FieldValues } from "@/lib/documents";

interface DocumentChatProps {
  documentType: string;
  fields: FieldValues;
  onResult: (documentType: string, fields: FieldValues) => void;
}

const GREETING: ChatMessage = {
  role: "assistant",
  content:
    "Hi! I'll help you create a legal document. What kind of agreement do you need? " +
    "I can put together a Mutual NDA, a Data Processing Agreement, a Pilot Agreement, " +
    "or a Cloud Service Agreement — just describe what you're after.",
};

export default function DocumentChat({ documentType, fields, onResult }: DocumentChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, sending]);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    void send();
  }

  async function send() {
    const text = input.trim();
    if (!text || sending) return;

    const next = [...messages, { role: "user" as const, content: text }];
    setMessages(next);
    setInput("");
    setError(null);
    setSending(true);
    try {
      const response = await api.chat(next, documentType, fields);
      setMessages([...next, { role: "assistant", content: response.reply }]);
      onResult(response.documentType, response.fields);
    } catch (err) {
      // Roll back the optimistic user message so it can be retried.
      setMessages(messages);
      setInput(text);
      setError(
        err instanceof ApiError
          ? err.message
          : "Couldn't reach the assistant. Please try again.",
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex h-[28rem] flex-col rounded-xl border border-slate-200 bg-white shadow-sm">
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.map((message, index) => (
          <ChatBubble key={index} message={message} />
        ))}
        {sending && (
          <ChatBubble message={{ role: "assistant", content: "Thinking…" }} muted />
        )}
      </div>

      {error && (
        <p role="alert" className="px-4 pb-2 text-sm text-red-600">
          {error}
        </p>
      )}

      <form onSubmit={submit} className="flex items-end gap-2 border-t border-slate-200 p-3">
        <textarea
          aria-label="Message"
          rows={1}
          className="max-h-32 flex-1 resize-none rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
          placeholder="Describe the agreement you need…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void send();
            }
          }}
        />
        <button
          type="submit"
          disabled={sending || !input.trim()}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}

function ChatBubble({ message, muted }: { message: ChatMessage; muted?: boolean }) {
  const isUser = message.role === "user";
  return (
    <div className={isUser ? "flex justify-end" : "flex justify-start"}>
      <div
        className={[
          "max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-sm",
          isUser
            ? "bg-slate-900 text-white"
            : muted
              ? "bg-slate-100 text-slate-400"
              : "bg-slate-100 text-slate-800",
        ].join(" ")}
      >
        {message.content}
      </div>
    </div>
  );
}
