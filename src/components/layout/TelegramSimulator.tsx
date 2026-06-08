"use client";

import React, { useState, useEffect } from "react";
import { db } from "@/lib/db";
import { NotificationLog } from "@/types/database.types";
import { MessageSquare, X, Send, Bell, Trash2 } from "lucide-react";

export default function TelegramSimulator() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationLog[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [chatInput, setChatInput] = useState("");
  const [isLinked, setIsLinked] = useState(false);

  // Poll notifications from local database
  useEffect(() => {
    const checkNotifs = () => {
      if (!db) return;
      const notifs = db.getNotifications();
      setNotifications(notifs);
      
      const user = db.getCurrentUser();
      setIsLinked(!!user.telegram_id);
    };

    checkNotifs();
    const interval = setInterval(checkNotifs, 1000);
    return () => clearInterval(interval);
  }, []);

  // Update unread count when closed
  useEffect(() => {
    if (!isOpen) {
      setUnreadCount(notifications.length);
    } else {
      setUnreadCount(0);
    }
  }, [notifications, isOpen]);

  const handleClear = () => {
    if (!db) return;
    db.clearNotifications();
    setNotifications([]);
  };

  const handleSendStart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !db) return;

    const text = chatInput.trim();
    setChatInput("");

    if (text.startsWith("/start link_") || text.startsWith("/start VERIFY")) {
      const code = text.replace("/start ", "");
      const user = db.getCurrentUser();
      db.linkTelegram(user.telegram_username || "verified_gamer", 12345678);
    } else if (text === "/status") {
      const user = db.getCurrentUser();
      db.pushNotification(
        12345678,
        `🤖 Telegram Status:\nName: ${user.name}\nRole: ${user.role}\nTelegram ID: ${user.telegram_id || "Not Linked"}`
      );
    } else if (text === "/help") {
      db.pushNotification(
        12345678,
        `🤖 Available Commands:\n/start VERIFY123 - Link account\n/status - Check profile status\n/help - Show this message`
      );
    } else {
      db.pushNotification(
        12345678,
        `🤖 Bot: Received "${text}". Send /help to see commands.`
      );
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Expandable Bot Window */}
      {isOpen ? (
        <div className="w-80 sm:w-96 h-[480px] bg-slate-950 border border-accent/40 rounded-2xl flex flex-col shadow-[0_0_30px_rgba(0,212,255,0.2)] overflow-hidden animate-in slide-in-from-bottom-5 duration-200">
          
          {/* Header */}
          <div className="p-4 bg-slate-900 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center border border-accent/40">
                <span className="text-accent text-xs font-bold font-display">CA</span>
              </div>
              <div>
                <h4 className="text-sm font-bold text-text-primary">Crew Arena Bot Simulator</h4>
                <p className="text-[10px] text-accent flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  Active Webhook
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={handleClear}
                title="Clear Logs"
                className="p-1 hover:bg-white/10 rounded text-text-secondary hover:text-red-400 transition"
              >
                <Trash2 size={16} />
              </button>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-white/10 rounded text-text-secondary hover:text-text-primary transition"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Setup / Instructions banner */}
          {!isLinked && (
            <div className="bg-accent/10 p-2 text-center text-[10px] text-accent border-b border-accent/20">
              💡 To test bot link, type: <code className="bg-black/50 px-1 py-0.5 rounded font-mono">/start VERIFY123</code>
            </div>
          )}

          {/* Chat Feed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 flex flex-col-reverse">
            {notifications.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-text-secondary">
                <Bell size={24} className="opacity-30 mb-2 animate-bounce" />
                <p className="text-xs">No notifications sent yet.</p>
                <p className="text-[10px] mt-1 opacity-60">Actions like Room assignments, Payment approval, or Results entry will push live notifications here.</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div key={notif.id} className="flex flex-col gap-1">
                  <div className="self-start bg-slate-900 border border-border/80 text-text-primary text-xs rounded-2xl rounded-tl-none p-3 max-w-[85%] shadow-md">
                    <div className="text-[10px] text-accent/80 font-semibold mb-1 uppercase tracking-wider">
                      STATUS: {notif.status}
                    </div>
                    <p className="whitespace-pre-line leading-relaxed font-sans">{notif.message_text}</p>
                  </div>
                  <span className="text-[9px] text-text-secondary/60 ml-2">
                    {new Date(notif.sent_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              ))
            )}
          </div>

          {/* Input Area (Mock Bot Control) */}
          <form onSubmit={handleSendStart} className="p-3 bg-slate-900 border-t border-border flex gap-2">
            <input
              type="text"
              placeholder="Send bot command (/status, /help)..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              className="flex-1 bg-black/60 border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-accent text-text-primary placeholder:text-text-secondary/40 font-mono"
            />
            <button
              type="submit"
              className="p-2 bg-accent hover:bg-accent-hover text-black font-semibold rounded-xl flex items-center justify-center transition"
            >
              <Send size={14} />
            </button>
          </form>

        </div>
      ) : (
        /* Floating Button Indicator */
        <button
          onClick={() => setIsOpen(true)}
          className="relative w-14 h-14 bg-accent text-black rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(0,212,255,0.4)] hover:scale-105 transition duration-200"
        >
          <MessageSquare size={22} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold border-2 border-black">
              {unreadCount}
            </span>
          )}
        </button>
      )}
    </div>
  );
}
