"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, UserPlus, Users, Mail, Phone, Calendar, ShieldCheck, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";

interface TeamMember {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  createdAt: string;
  _count?: {
    leads: number;
    followUps: number;
  };
}

export default function TeamManagementPage() {
  const { showToast } = useToast();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchTeam = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/settings/team");
      if (res.ok) {
        const data = await res.json();
        setMembers(data.users || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeam();
  }, []);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/settings/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
          password: password,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to add team member");
      }

      showToast("Team member added successfully!", "success");
      setName("");
      setEmail("");
      setPhone("");
      setPassword("");
      setIsAddModalOpen(false);
      fetchTeam();
    } catch (err: any) {
      showToast(err.message || "Failed to add team member", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/settings"
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 transition-colors shadow-2xs"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Team & Sales Agents</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage your sales team, divide leads, and track agent workloads
            </p>
          </div>
        </div>

        <Button onClick={() => setIsAddModalOpen(true)} className="shadow-xs">
          <UserPlus className="h-4 w-4 mr-1.5" /> Add Member
        </Button>
      </div>

      {/* Team Members List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-36 bg-slate-100 animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : members.length === 0 ? (
        <Card className="p-8 text-center space-y-3">
          <Users className="h-10 w-10 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-900 text-base">No team members yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Add your sales executives and agents so you can assign incoming leads to them.
          </p>
          <Button onClick={() => setIsAddModalOpen(true)}>
            <UserPlus className="h-4 w-4 mr-1.5" /> Add First Team Member
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {members.map((member, index) => (
            <Card key={member.id} className="p-5 space-y-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-base uppercase shadow-xs overflow-hidden">
                    {member.avatarUrl ? (
                      <img src={member.avatarUrl} alt={member.name} className="h-full w-full object-cover" />
                    ) : (
                      <span>{member.name?.[0] || "U"}</span>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-bold text-slate-900 text-sm">{member.name}</h3>
                      {index === 0 && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700">
                          Account Owner
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5 font-mono">
                      <Mail className="h-3 w-3 text-slate-400" />
                      <span>{member.email}</span>
                    </p>
                  </div>
                </div>

                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="h-2.5 w-2.5" /> Active
                </span>
              </div>

              {/* Stats / Workload */}
              <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 text-center">
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <p className="text-base font-extrabold text-slate-900">{member._count?.leads || 0}</p>
                  <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Assigned Leads</p>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <p className="text-base font-extrabold text-indigo-600">{member._count?.followUps || 0}</p>
                  <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Follow-ups</p>
                </div>
              </div>

              {member.phone && (
                <div className="text-xs text-slate-500 flex items-center gap-1 pt-1 font-mono">
                  <Phone className="h-3 w-3 text-slate-400" />
                  <span>{member.phone}</span>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Add Member Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Team Member"
        size="md"
      >
        <form onSubmit={handleAddMember} className="space-y-4">
          <Input
            label="Full Name"
            placeholder="e.g. Rahul Sharma"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <Input
            label="Email Address (Login ID)"
            type="email"
            placeholder="e.g. rahul@yourcompany.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Input
            label="Mobile Phone"
            placeholder="e.g. 9876543210"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />

          <Input
            label="Initial Password"
            type="password"
            placeholder="Minimum 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddModalOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              <UserPlus className="h-4 w-4 mr-1.5" /> Create Account
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
