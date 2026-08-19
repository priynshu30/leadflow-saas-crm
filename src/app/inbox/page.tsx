"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import {
  Mail,
  Inbox,
  Search,
  RefreshCw,
  Send,
  Reply,
  ExternalLink,
  Clock,
  CheckCircle2,
  Circle,
  UserCircle2,
  ArrowLeft,
  Filter,
  AlertCircle,
} from "lucide-react";

interface EmailMessage {
  id: number;
  fromEmail: string;
  fromName: string;
  toEmail: string;
  subject: string;
  body: string;
  direction: string;
  status: string;
  createdAt: string;
  lead?: {
    id: number;
    name: string;
    phone: string;
    status: string;
    field1Value?: string;
  } | null;
}

export default function InboxPage() {
  const { showToast } = useToast();
  const [messages, setMessages] = useState<EmailMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedMessage, setSelectedMessage] = useState<EmailMessage | null>(null);
  const [replyBody, setReplyBody] = useState("");
  const [replying, setReplying] = useState(false);

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ status: statusFilter, search });
      const res = await fetch(`/api/inbox?${params}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch {
      //
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const handleOpenMessage = async (msg: EmailMessage) => {
    setSelectedMessage(msg);
    setReplyBody(`\n\n---\nOn ${new Date(msg.createdAt).toLocaleString("en-IN")}, ${msg.fromName || msg.fromEmail} wrote:\n\n${msg.body}`);
    // Mark as read via API (GET marks it read)
    if (msg.status === "UNREAD") {
      await fetch(`/api/inbox/${msg.id}`);
      setMessages((prev) => prev.map((m) => m.id === msg.id ? { ...m, status: "READ" } : m));
      setUnreadCount((c) => Math.max(0, c - 1));
    }
  };

  const handleReply = async () => {
    if (!selectedMessage) return;
    setReplying(true);
    try {
      const res = await fetch(`/api/inbox/${selectedMessage.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          replyBody,
          subject: `Re: ${selectedMessage.subject}`,
        }),
      });

      if (res.ok) {
        // Open mail client
        const mailtoUrl = `mailto:${selectedMessage.fromEmail}?subject=${encodeURIComponent(`Re: ${selectedMessage.subject}`)}&body=${encodeURIComponent(replyBody)}`;
        window.open(mailtoUrl, "_blank");
        showToast("Reply sent & activity logged!", "success");
        setSelectedMessage(null);
        fetchMessages();
      } else {
        const data = await res.json();
        showToast(data.error || "Failed to reply", "error");
      }
    } catch {
      showToast("Failed to send reply", "error");
    } finally {
      setReplying(false);
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "UNREAD": return "text-indigo-600 bg-indigo-50 border-indigo-200";
      case "READ": return "text-slate-500 bg-slate-50 border-slate-200";
      case "REPLIED": return "text-emerald-600 bg-emerald-50 border-emerald-200";
      default: return "text-slate-500 bg-slate-50 border-slate-200";
    }
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case "UNREAD": return <Circle className="h-2.5 w-2.5 fill-indigo-500 text-indigo-500" />;
      case "READ": return <CheckCircle2 className="h-2.5 w-2.5 text-slate-400" />;
      case "REPLIED": return <Reply className="h-2.5 w-2.5 text-emerald-500" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-100">
              <Inbox className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Email Inbox</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                All incoming client emails linked to your CRM leads
                {unreadCount > 0 && (
                  <span className="ml-2 px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-bold text-[11px]">
                    {unreadCount} unread
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
        <Button onClick={fetchMessages} variant="outline" size="sm">
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Refresh
        </Button>
      </div>

      {selectedMessage ? (
        /* Email Read View */
        <Card className="space-y-0 p-0 overflow-hidden">
          {/* Email Header */}
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-start justify-between gap-4">
            <div className="space-y-1">
              <button
                onClick={() => setSelectedMessage(null)}
                className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 mb-2"
              >
                <ArrowLeft className="h-3 w-3" /> Back to Inbox
              </button>
              <h2 className="font-bold text-slate-900 text-base">{selectedMessage.subject}</h2>
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <UserCircle2 className="h-3.5 w-3.5 text-slate-400" />
                <span className="font-semibold">{selectedMessage.fromName || selectedMessage.fromEmail}</span>
                <span className="text-slate-400">&lt;{selectedMessage.fromEmail}&gt;</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                <Clock className="h-3 w-3" />
                {new Date(selectedMessage.createdAt).toLocaleString("en-IN", {
                  day: "numeric", month: "short", year: "numeric",
                  hour: "2-digit", minute: "2-digit"
                })}
              </div>
            </div>

            {selectedMessage.lead && (
              <Link
                href={`/leads/${selectedMessage.lead.id}`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-700 text-xs font-semibold hover:bg-indigo-100"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                View Lead: {selectedMessage.lead.name}
              </Link>
            )}
          </div>

          {/* Email Body */}
          <div className="px-6 py-5">
            <div className="whitespace-pre-wrap text-sm text-slate-800 leading-relaxed bg-slate-50 rounded-xl p-4 border border-slate-100">
              {selectedMessage.body}
            </div>
          </div>

          {/* Reply Section */}
          <div className="px-6 py-4 border-t border-slate-100 space-y-3">
            <p className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Reply className="h-3.5 w-3.5 text-indigo-600" /> Reply to {selectedMessage.fromName || selectedMessage.fromEmail}
            </p>
            <textarea
              rows={5}
              value={replyBody}
              onChange={(e) => setReplyBody(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              placeholder="Type your reply..."
            />
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setSelectedMessage(null)} disabled={replying}>
                Cancel
              </Button>
              <Button onClick={handleReply} loading={replying} disabled={!replyBody.trim()}>
                <Send className="h-4 w-4 mr-1.5" /> Send Reply via Mail App & Log
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <>
          {/* Filters Row */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="search"
                placeholder="Search emails, sender, subject..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>
            <div className="flex rounded-xl border border-slate-200 bg-white overflow-hidden">
              {["ALL", "UNREAD", "READ", "REPLIED"].map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-2 text-xs font-semibold transition-colors ${
                    statusFilter === s
                      ? "bg-indigo-600 text-white"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Message List */}
          <Card className="p-0 overflow-hidden divide-y divide-slate-100">
            {loading ? (
              <div className="py-16 text-center">
                <RefreshCw className="h-6 w-6 text-slate-300 animate-spin mx-auto mb-2" />
                <p className="text-sm text-slate-400">Loading inbox...</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="py-16 text-center">
                <Inbox className="h-10 w-10 text-slate-200 mx-auto mb-3" />
                <p className="text-sm font-medium text-slate-500">No emails found</p>
                <p className="text-xs text-slate-400 mt-1">
                  {statusFilter !== "ALL" ? `No ${statusFilter.toLowerCase()} emails` : "Your inbox is empty"}
                </p>
              </div>
            ) : (
              messages.map((msg) => (
                <button
                  key={msg.id}
                  onClick={() => handleOpenMessage(msg)}
                  className={`w-full text-left px-5 py-4 hover:bg-slate-50 transition-colors flex items-start gap-4 group ${
                    msg.status === "UNREAD" ? "bg-indigo-50/40" : ""
                  }`}
                >
                  {/* Avatar */}
                  <div className={`shrink-0 h-9 w-9 rounded-xl flex items-center justify-center text-sm font-bold uppercase shadow-2xs ${
                    msg.direction === "INBOUND"
                      ? "bg-indigo-100 text-indigo-700"
                      : "bg-emerald-100 text-emerald-700"
                  }`}>
                    {(msg.fromName || msg.fromEmail)?.[0] || "?"}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <p className={`text-sm truncate ${msg.status === "UNREAD" ? "font-bold text-slate-900" : "font-medium text-slate-700"}`}>
                          {msg.fromName || msg.fromEmail}
                        </p>
                        {msg.direction === "OUTBOUND" && (
                          <span className="shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                            Sent
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`hidden sm:flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${statusColor(msg.status)}`}>
                          {statusIcon(msg.status)} {msg.status}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {new Date(msg.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                        </span>
                      </div>
                    </div>
                    <p className={`text-xs mt-0.5 truncate ${msg.status === "UNREAD" ? "text-slate-800 font-semibold" : "text-slate-600"}`}>
                      {msg.subject}
                    </p>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">{msg.body.slice(0, 80)}...</p>
                    {msg.lead && (
                      <p className="text-[10px] text-indigo-600 mt-1 font-medium">
                        🔗 Lead: {msg.lead.name} · {msg.lead.field1Value}
                      </p>
                    )}
                  </div>
                </button>
              ))
            )}
          </Card>
        </>
      )}
    </div>
  );
}
