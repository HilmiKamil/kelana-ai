"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { getCleanApiUrl } from "@/services/authService";

const BASE_URL = getCleanApiUrl();

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Message {
  role:        "user" | "assistant";
  content:     string;
  created_at?: string;   // ISO string — optional for optimistic messages
}

interface Conversation {
  id:         number;
  title:      string | null;
  created_at: string;
}

// ---------------------------------------------------------------------------
// API helpers — token passed explicitly, no localStorage inside
// ---------------------------------------------------------------------------

async function apiFetchConversations(token: string): Promise<Conversation[]> {
  const res = await fetch(`${BASE_URL}/api/v1/conversations`, {
    headers: { "Authorization": `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Failed to load conversations: ${res.status}`);
  return res.json();
}

async function apiCreateConversation(token: string, title?: string): Promise<number> {
  const res = await fetch(`${BASE_URL}/api/v1/conversations`, {
    method:  "POST",
    headers: {
      "Content-Type":  "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify(title ? { title } : {}),
  });
  if (!res.ok) throw new Error(`Failed to create conversation: ${res.status}`);
  const data = await res.json();
  return data.conversation_id as number;
}

async function apiFetchMessages(conversationId: number, token: string): Promise<Message[]> {
  const res = await fetch(`${BASE_URL}/api/v1/conversations/${conversationId}/messages`, {
    headers: { "Authorization": `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Failed to load messages: ${res.status}`);
  return res.json();
}

async function apiSendMessage(
  conversationId: number,
  message: string,
  token: string,
): Promise<Message> {
  const res = await fetch(`${BASE_URL}/api/v1/conversations/${conversationId}/messages`, {
    method:  "POST",
    headers: {
      "Content-Type":  "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify({ message }),
  });
  if (!res.ok) throw new Error(`Failed to send message: ${res.status}`);
  return res.json();
}

async function apiRenameConversation(
  conversationId: number,
  title: string,
  token: string,
): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/v1/conversations/${conversationId}`, {
    method:  "PATCH",
    headers: {
      "Content-Type":  "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify({ title }),
  });
  if (!res.ok) throw new Error(`Failed to rename conversation: ${res.status}`);
}

async function apiDeleteConversation(
  conversationId: number,
  token: string,
): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/v1/conversations/${conversationId}`, {
    method:  "DELETE",
    headers: { "Authorization": `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Failed to delete conversation: ${res.status}`);
}

// ---------------------------------------------------------------------------
// Helper: redirect to login on auth errors
// ---------------------------------------------------------------------------

function isAuthError(message: string) {
  return message.includes("401") || message.includes("403");
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function AsciiDivider() {
  return (
    <p className="font-mono text-blue-400 text-xs tracking-widest overflow-hidden select-none">
      {"================================"}
    </p>
  );
}

// Single conversation item in the sidebar — supports inline rename + delete
function ConversationItem({
  conv,
  isActive,
  isEditing,
  editValue,
  onEditValueChange,
  onEditStart,
  onEditSave,
  onEditCancel,
  onDelete,
  onClick,
}: {
  conv:             Conversation;
  isActive:         boolean;
  isEditing:        boolean;
  editValue:        string;
  onEditValueChange: (v: string) => void;
  onEditStart:      () => void;
  onEditSave:       () => void;
  onEditCancel:     () => void;
  onDelete:         () => void;
  onClick:          () => void;
}) {
  const date = new Date(conv.created_at).toLocaleDateString("en-GB", {
    day:   "2-digit",
    month: "short",
    year:  "numeric",
  });

  // ── Edit mode: inline form ────────────────────────────────────────────────
  if (isEditing) {
    return (
      <form
        onSubmit={(e) => { e.preventDefault(); onEditSave(); }}
        className="flex flex-col gap-1 p-1 border-2 border-yellow-400 bg-black"
      >
        <input
          autoFocus
          value={editValue}
          onChange={(e) => onEditValueChange(e.target.value)}
          onKeyDown={(e) => e.key === "Escape" && onEditCancel()}
          className="
            w-full bg-black border border-slate-600 text-green-400
            font-mono text-xs px-2 py-1 outline-none
            focus:border-yellow-400 uppercase tracking-wide
          "
        />
        <div className="flex gap-1">
          <button
            type="submit"
            className="
              flex-1 bg-yellow-400 border border-black text-black
              font-mono text-[10px] uppercase tracking-widest font-bold
              py-0.5 hover:bg-white cursor-pointer
            "
          >
            SAVE
          </button>
          <button
            type="button"
            onClick={onEditCancel}
            className="
              flex-1 bg-black border border-slate-600 text-slate-400
              font-mono text-[10px] uppercase tracking-widest
              py-0.5 hover:border-red-500 hover:text-red-400 cursor-pointer
            "
          >
            CANCEL
          </button>
        </div>
      </form>
    );
  }

  // ── Normal mode ───────────────────────────────────────────────────────────
  return (
    <div className="group relative flex items-stretch">
      {/* Main clickable area */}
      <button
        onClick={onClick}
        className={`
          flex-1 text-left px-3 py-2 border-2 font-mono text-xs uppercase tracking-wide
          cursor-pointer transition-colors min-w-0
          ${isActive
            ? "bg-yellow-400 border-yellow-400 text-black"
            : "bg-black border-slate-700 text-slate-400 hover:border-yellow-400 hover:text-yellow-400"
          }
        `}
      >
        <p className="font-bold truncate">
          {conv.title ?? `SESSION #${conv.id}`}
        </p>
        <p className={`text-[10px] mt-0.5 ${isActive ? "text-black/60" : "text-slate-600"}`}>
          {date}
        </p>
      </button>

      {/* [EDIT] button — visible on hover */}
      <button
        onClick={(e) => { e.stopPropagation(); onEditStart(); }}
        title="Rename"
        className="
          shrink-0 px-1.5 border-l-0 border-2 border-slate-700
          bg-black text-slate-600 font-mono text-[10px] uppercase
          opacity-0 group-hover:opacity-100 transition-opacity
          hover:border-yellow-400 hover:text-yellow-400 cursor-pointer
        "
      >
        ✎
      </button>

      {/* [X] delete button — visible on hover, red destructive style */}
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        title="Delete"
        className="
          shrink-0 px-1.5 border-l-0 border-2 border-slate-700
          bg-black text-slate-600 font-mono text-[10px] uppercase
          opacity-0 group-hover:opacity-100 transition-opacity
          hover:border-red-500 hover:text-red-500 cursor-pointer
        "
      >
        ✕
      </button>
    </div>
  );
}

// Custom Markdown component map — keeps the retro terminal theme intact
const markdownComponents = {
  p:      ({ children }: React.HTMLAttributes<HTMLElement>) => (
    <p className="mb-4 last:mb-0">{children}</p>
  ),
  ul:     ({ children }: React.HTMLAttributes<HTMLElement>) => (
    <ul className="list-disc pl-5 mb-4">{children}</ul>
  ),
  ol:     ({ children }: React.HTMLAttributes<HTMLElement>) => (
    <ol className="list-decimal pl-5 mb-4">{children}</ol>
  ),
  li:     ({ children }: React.HTMLAttributes<HTMLElement>) => (
    <li className="mb-1">{children}</li>
  ),
  h1:     ({ children }: React.HTMLAttributes<HTMLElement>) => (
    <h1 className="text-lg font-bold text-yellow-400 mt-4 mb-2 uppercase tracking-widest">{children}</h1>
  ),
  h2:     ({ children }: React.HTMLAttributes<HTMLElement>) => (
    <h2 className="text-base font-bold text-yellow-400 mt-3 mb-2 uppercase tracking-widest">{children}</h2>
  ),
  h3:     ({ children }: React.HTMLAttributes<HTMLElement>) => (
    <h3 className="text-sm font-bold text-yellow-300 mt-3 mb-1 uppercase tracking-wide">{children}</h3>
  ),
  strong: ({ children }: React.HTMLAttributes<HTMLElement>) => (
    <strong className="font-bold text-yellow-300">{children}</strong>
  ),
  code:   ({ children }: React.HTMLAttributes<HTMLElement>) => (
    <code className="bg-black border border-slate-600 text-green-400 px-1 text-xs">{children}</code>
  ),
  hr:     () => (
    <hr className="border-blue-400 my-3" />
  ),
};

// Single chat bubble — right for user, left for assistant
function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";

  // Format timestamp as "HH:MM" in local time, or empty string if absent
  const timeLabel = msg.created_at
    ? new Date(msg.created_at).toLocaleTimeString([], {
        hour:   "2-digit",
        minute: "2-digit",
        hour12: false,
      })
    : "";

  return (
    <div className={`flex w-full ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="shrink-0 w-8 h-8 bg-blue-900 border-2 border-white flex items-center justify-center text-xs mr-2 mt-1 select-none">
          🤖
        </div>
      )}

      <div className="flex flex-col gap-0.5 max-w-[75%]">
        <div
          className={`
            px-4 py-3 font-mono text-sm leading-relaxed
            ${isUser
              ? "bg-yellow-400 text-black border-2 border-black whitespace-pre-wrap"
              : "bg-blue-900  text-white border-4 border-white"
            }
          `}
        >
          {isUser ? (
            msg.content
          ) : (
            <ReactMarkdown components={markdownComponents}>
              {msg.content}
            </ReactMarkdown>
          )}
        </div>

        {/* Timestamp — outside the bubble, muted and tiny */}
        {timeLabel && (
          <p
            className={`
              font-mono text-[9px] tracking-widest select-none
              ${isUser ? "text-right text-yellow-700" : "text-left text-slate-600"}
            `}
          >
            {timeLabel}
          </p>
        )}
      </div>

      {isUser && (
        <div className="shrink-0 w-8 h-8 bg-yellow-400 border-2 border-black flex items-center justify-center text-xs ml-2 mt-1 select-none">
          👤
        </div>
      )}
    </div>
  );
}

// Animated typing indicator
function TypingIndicator() {
  return (
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 bg-blue-900 border-2 border-white flex items-center justify-center text-xs select-none">
        🤖
      </div>
      <div className="bg-blue-900 border-4 border-white px-4 py-3">
        <span className="font-mono text-yellow-400 text-sm animate-pulse tracking-widest">
          ▓▓░░ THINKING...
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Chat Page
// ---------------------------------------------------------------------------

export default function ChatPage() {
  const router = useRouter();

  // ── State ─────────────────────────────────────────────────────────────────
  const [conversations,        setConversations]        = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  const [messages,             setMessages]             = useState<Message[]>([]);
  const [inputText,            setInputText]            = useState("");
  const [isLoading,            setIsLoading]            = useState(false);
  const [isSidebarLoading,     setIsSidebarLoading]     = useState(true);
  const [isChatLoading,        setIsChatLoading]        = useState(false);
  const [error,                setError]                = useState<string | null>(null);
  // ── Rename edit state ─────────────────────────────────────────────────────
  const [editingConversationId, setEditingConversationId] = useState<number | null>(null);
  const [editTitleValue,        setEditTitleValue]        = useState("");

  const bottomRef = useRef<HTMLDivElement>(null);

  // ── Auto-scroll on new messages / typing indicator ────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // ── Helper: redirect on auth error ───────────────────────────────────────
  const handleAuthError = useCallback((msg: string) => {
    if (isAuthError(msg)) {
      localStorage.removeItem("token");
      router.push("/login");
      return true;
    }
    return false;
  }, [router]);

  // ── On mount: auth check + load conversation list ─────────────────────────
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }

    apiFetchConversations(token)
      .then((data) => setConversations(data))
      .catch((err) => {
        const msg = err instanceof Error ? err.message : "Failed to load conversations.";
        if (!handleAuthError(msg)) setError(msg);
      })
      .finally(() => setIsSidebarLoading(false));
  }, [router, handleAuthError]);

  // ── Load messages when active conversation changes ────────────────────────
  useEffect(() => {
    if (activeConversationId === null) return;

    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }

    setMessages([]);
    setError(null);
    setIsChatLoading(true);

    apiFetchMessages(activeConversationId, token)
      .then((data) => setMessages(data))
      .catch((err) => {
        const msg = err instanceof Error ? err.message : "Failed to load messages.";
        if (!handleAuthError(msg)) setError(msg);
      })
      .finally(() => setIsChatLoading(false));
  }, [activeConversationId, router, handleAuthError]);

  // ── Create a new conversation ─────────────────────────────────────────────
  // The + button only clears the active chat — the conversation is actually
  // created (with an auto-title) when the user sends their first message.
  function handleNewConversation() {
    setActiveConversationId(null);
    setMessages([]);
    setError(null);
  }

  // ── Rename a conversation ─────────────────────────────────────────────────
  async function handleRenameSave(conversationId: number) {
    const title = editTitleValue.trim();
    if (!title) return;

    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }

    try {
      await apiRenameConversation(conversationId, title, token);
      // Update the title in local state — no full refetch needed
      setConversations((prev) =>
        prev.map((c) => c.id === conversationId ? { ...c, title } : c),
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to rename.";
      if (!handleAuthError(msg)) setError(msg);
    } finally {
      setEditingConversationId(null);
      setEditTitleValue("");
    }
  }

  // ── Delete a conversation ─────────────────────────────────────────────────
  async function handleDelete(conversationId: number) {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }

    try {
      await apiDeleteConversation(conversationId, token);

      // Remove from sidebar state immediately — no refetch needed
      setConversations((prev) => prev.filter((c) => c.id !== conversationId));

      // If the deleted conversation was active, clear the chat area
      if (activeConversationId === conversationId) {
        handleNewConversation();
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to delete conversation.";
      if (!handleAuthError(msg)) setError(msg);
    }
  }

  // ── Send a message ────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = inputText.trim();
    if (!text || isLoading) return;

    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }

    // Optimistic update — show the user's message immediately
    const userMsg: Message = {
      role:       "user",
      content:    text,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setIsLoading(true);
    setError(null);

    try {
      let convId = activeConversationId;

      // No active conversation yet — create one now, using the first 40
      // characters of the message as the auto-title (ChatGPT-style).
      if (!convId) {
        const autoTitle = text.length > 40 ? text.slice(0, 40) + "…" : text;
        convId = await apiCreateConversation(token, autoTitle);

        // Add the new conversation to the top of the sidebar immediately
        const newConv: Conversation = {
          id:         convId,
          title:      autoTitle,
          created_at: new Date().toISOString(),
        };
        setConversations((prev) => [newConv, ...prev]);
        setActiveConversationId(convId);
      }

      const aiMsg = await apiSendMessage(convId, text, token);
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to send message.";
      if (!handleAuthError(msg)) {
        setError(msg);
        // Roll back optimistic message and restore input on failure
        setMessages((prev) => prev.slice(0, -1));
        setInputText(text);
      }
    } finally {
      setIsLoading(false);
    }
  }

  // Shift+Enter = newline, Enter = submit
  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <main className="bg-slate-900 font-mono flex" style={{ height: "calc(100vh - 56px)" }}>

      {/* ════ SIDEBAR ════ */}
      <aside className="w-56 shrink-0 bg-black border-r-4 border-slate-700 flex flex-col">

        {/* Sidebar header + New button */}
        <div className="px-3 py-3 border-b-2 border-slate-700 flex items-center justify-between">
          <span className="font-mono text-yellow-400 text-xs uppercase tracking-widest font-bold">
            💬 CHATS
          </span>
          <button
            onClick={handleNewConversation}
            title="Start new conversation"
            className="
              w-7 h-7 bg-yellow-400 border-2 border-black text-black
              font-mono font-bold text-sm flex items-center justify-center
              hover:bg-white cursor-pointer
            "
          >
            +
          </button>
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto flex flex-col gap-1 p-2">
          {isSidebarLoading ? (
            <p className="font-mono text-slate-600 text-xs uppercase tracking-widest text-center mt-4 animate-pulse">
              LOADING...
            </p>
          ) : conversations.length === 0 ? (
            <p className="font-mono text-slate-600 text-xs uppercase tracking-widest text-center mt-4">
              NO CHATS YET
            </p>
          ) : (
            conversations.map((conv) => (
              <ConversationItem
                key={conv.id}
                conv={conv}
                isActive={conv.id === activeConversationId}
                isEditing={conv.id === editingConversationId}
                editValue={editTitleValue}
                onEditValueChange={setEditTitleValue}
                onEditStart={() => {
                  setEditingConversationId(conv.id);
                  setEditTitleValue(conv.title ?? `SESSION #${conv.id}`);
                }}
                onEditSave={() => handleRenameSave(conv.id)}
                onEditCancel={() => {
                  setEditingConversationId(null);
                  setEditTitleValue("");
                }}
                onDelete={() => handleDelete(conv.id)}
                onClick={() => setActiveConversationId(conv.id)}
              />
            ))
          )}
        </div>

      </aside>

      {/* ════ MAIN CHAT AREA ════ */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Chat header */}
        <div className="px-6 py-3 border-b-2 border-slate-700 shrink-0">
          <h1 className="font-mono font-bold text-yellow-400 uppercase tracking-widest text-lg">
            💬 AI TRAVEL ASSISTANT
          </h1>
          <p className="font-mono text-slate-500 text-xs uppercase tracking-widest">
            {activeConversationId ? `SESSION #${activeConversationId}` : "SELECT OR START A CONVERSATION"}
          </p>
        </div>

        {/* ── Message area — always rendered, content changes based on state ── */}
        <div className="flex-1 overflow-y-auto flex flex-col gap-4 px-6 py-4 min-h-0">

          {/* Placeholder — no active conversation yet */}
          {!activeConversationId && (
            <div className="flex-1 flex flex-col items-center justify-center text-center gap-3 py-16">
              <span className="text-5xl select-none">🗺</span>
              <p className="font-mono text-slate-500 text-xs uppercase tracking-widest">
                SELECT AN EXISTING CONVERSATION<br />OR START TYPING BELOW TO CREATE A NEW ONE
              </p>
            </div>
          )}

          {/* Chat loading (switching conversations) */}
          {activeConversationId && isChatLoading && (
            <div className="flex-1 flex items-center justify-center">
              <p className="font-mono text-yellow-400 text-xs uppercase tracking-widest animate-pulse">
                ▓▓░░ LOADING HISTORY...
              </p>
            </div>
          )}

          {/* Empty active conversation */}
          {activeConversationId && !isChatLoading && messages.length === 0 && !isLoading && (
            <div className="flex-1 flex flex-col items-center justify-center text-center gap-3 py-16">
              <span className="text-4xl select-none">✨</span>
              <p className="font-mono text-slate-500 text-xs uppercase tracking-widest">
                NEW CONVERSATION STARTED.<br />ASK YOUR FIRST QUESTION BELOW.
              </p>
            </div>
          )}

          {/* Message bubbles */}
          {messages.map((msg, i) => (
            <MessageBubble key={i} msg={msg} />
          ))}

          {/* Typing indicator */}
          {isLoading && <TypingIndicator />}

          {/* Inline error */}
          {error && (
            <div className="bg-red-900 border-2 border-red-400 text-red-300 font-mono text-xs px-4 py-3 uppercase tracking-wide">
              ⚠ {error}
            </div>
          )}

          {/* Auto-scroll anchor */}
          <div ref={bottomRef} />
        </div>

        {/* ── Input bar — always visible, enables lazy conversation creation ── */}
        <div className="shrink-0 px-6 py-4 border-t-4 border-slate-700">
          <form onSubmit={handleSubmit} className="flex gap-2 items-end">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                activeConversationId
                  ? "Type your question... (Enter to send)"
                  : "Type your first message to start a new conversation..."
              }
              rows={2}
              disabled={isLoading || isChatLoading}
              className="
                flex-1 bg-black border-2 border-slate-500 text-green-400
                font-mono text-sm px-3 py-2 outline-none
                placeholder-slate-600 focus:border-yellow-400
                resize-none disabled:opacity-50
              "
            />
            <button
              type="submit"
              disabled={isLoading || isChatLoading || !inputText.trim()}
              className="
                shrink-0 bg-red-600 border-4 border-white text-white
                font-mono font-bold text-xs uppercase tracking-widest
                px-4 py-2 self-stretch
                hover:bg-white hover:text-red-600
                disabled:opacity-50 disabled:cursor-not-allowed
                cursor-pointer
              "
            >
              {isLoading ? "..." : "SEND →"}
            </button>
          </form>
          <p className="font-mono text-slate-700 text-xs mt-1 uppercase tracking-widest">
            SHIFT+ENTER FOR NEWLINE · ENTER TO SEND
          </p>
        </div>

      </div>

    </main>
  );
}
