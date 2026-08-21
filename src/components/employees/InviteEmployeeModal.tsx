"use client";

import React, { useState } from "react";
import { X, UserPlus, Mail, User } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";

interface InviteEmployeeModalProps {
  onClose: () => void;
  onInvited: () => void;
}

export function InviteEmployeeModal({ onClose, onInvited }: InviteEmployeeModalProps) {
  const { showToast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) {
      showToast("All fields are required", "error");
      return;
    }
    if (password.length < 6) {
      showToast("Password must be at least 6 characters", "error");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/employees/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create agent");
      showToast(`Agent "${name}" created successfully! They can now log in.`, "success");
      onInvited();
      onClose();
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-100">
        <div className="p-5 border-b border-slate-100 flex items-start justify-between">
          <div>
            <h2 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-indigo-600" /> Add Field Agent
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Create login credentials for your team member</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <Input
            label="Full Name"
            type="text"
            placeholder="e.g. Rahul Sharma"
            value={name}
            onChange={(e) => setName(e.target.value)}
            leftIcon={<User className="h-4 w-4" />}
            required
          />
          <Input
            label="Email Address"
            type="email"
            placeholder="e.g. rahul@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={<Mail className="h-4 w-4" />}
            required
          />
          <Input
            label="Initial Password"
            type="text"
            placeholder="Minimum 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <p className="text-[11px] text-amber-600 bg-amber-50 px-3 py-2 rounded-lg border border-amber-200">
            💡 Share these credentials with the agent. They can change their password later in Settings.
          </p>

          <div className="flex gap-2 pt-1">
            <Button type="button" variant="secondary" className="flex-1" onClick={onClose} size="sm">Cancel</Button>
            <Button type="submit" loading={loading} className="flex-1" size="sm">Create Agent</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
