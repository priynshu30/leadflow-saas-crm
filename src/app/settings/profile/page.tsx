"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toast";
import { ArrowLeft, Save, User, Mail, Building2, Phone, Lock, KeyRound, CheckCircle2 } from "lucide-react";

export default function ProfilePage() {
  const { showToast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Password Change
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const fetchProfile = () => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setName(data.user.name || "");
          setEmail(data.user.email || "");
          setPhone(data.user.phone || "");
          setAvatarUrl(data.user.avatarUrl || null);
          setBusinessName(data.user.businessName || "");
          setBusinessType(data.user.businessType || "");
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      showToast("Please choose an image under 2MB", "error");
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const base64 = uploadEvent.target?.result as string;
      setAvatarUrl(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setAvatarUrl(null);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword && newPassword !== confirmPassword) {
      showToast("New passwords do not match", "error");
      return;
    }

    setSaving(true);
    try {
      const payload: any = { 
        name: name.trim(),
        avatarUrl: avatarUrl,
      };
      if (phone !== undefined) payload.phone = phone.trim();
      if (newPassword) {
        payload.currentPassword = currentPassword;
        payload.newPassword = newPassword;
      }

      const res = await fetch("/api/settings/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update profile");
      }

      showToast("Profile and photo updated successfully!", "success");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      fetchProfile();
    } catch (err: any) {
      showToast(err.message || "Failed to update profile", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="h-64 bg-slate-200 animate-pulse rounded-xl" />;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/settings"
          className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Account & Profile</h1>
          <p className="text-xs text-slate-500 mt-0.5">Manage your photo, login email, workspace and credentials</p>
        </div>
      </div>

      <Card>
        <form onSubmit={handleUpdateProfile} className="space-y-6">
          {/* Profile Photo & Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-50/70 via-slate-50 to-slate-50 border border-indigo-100/60 flex flex-col sm:flex-row items-center gap-5">
            <div className="relative group">
              <div className="h-20 w-20 rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-2xl font-bold uppercase shadow-md overflow-hidden border-2 border-white ring-2 ring-indigo-200">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={name} className="h-full w-full object-cover" />
                ) : (
                  <span>{name?.[0] || "U"}</span>
                )}
              </div>
              <label
                htmlFor="avatar-upload"
                className="absolute -bottom-1.5 -right-1.5 p-1.5 rounded-full bg-indigo-600 text-white shadow-md hover:bg-indigo-700 cursor-pointer transition-transform hover:scale-110 active:scale-95"
                title="Upload photo"
              >
                <User className="h-3.5 w-3.5" />
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>
            </div>

            <div className="flex-1 text-center sm:text-left space-y-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h3 className="font-bold text-slate-900 text-lg">{name || "Your Name"}</h3>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="h-3 w-3" /> Active
                </span>
              </div>
              <p className="text-xs text-slate-600 font-mono">{email}</p>
              <div className="pt-1 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <label
                  htmlFor="avatar-upload"
                  className="cursor-pointer text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200/80 transition-colors"
                >
                  📷 Change Photo
                </label>
                {avatarUrl && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="text-xs font-semibold text-rose-600 hover:text-rose-800 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200/80 transition-colors"
                  >
                    Remove Photo
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Account Details Section */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Account Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Login Email (Your CRM Account ID)"
                value={email}
                readOnly
                disabled
                helperText="Primary email used to login and receive tenant notifications"
                leftIcon={<Mail className="h-4 w-4 text-slate-400" />}
              />
              <Input
                label="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                leftIcon={<User className="h-4 w-4" />}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Mobile Phone"
                placeholder="e.g. 9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                leftIcon={<Phone className="h-4 w-4" />}
              />
              <Input
                label="Business Organization"
                value={businessName}
                readOnly
                disabled
                leftIcon={<Building2 className="h-4 w-4 text-slate-400" />}
              />
            </div>
          </div>

          {/* Change Password Section */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <KeyRound className="h-4 w-4 text-indigo-600" /> Change Password
            </h2>
            <p className="text-xs text-slate-500 -mt-2">Leave blank if you don't wish to change your password</p>

            <Input
              label="Current Password"
              type="password"
              placeholder="••••••••"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              leftIcon={<Lock className="h-4 w-4" />}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="New Password"
                type="password"
                placeholder="Minimum 6 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                leftIcon={<Lock className="h-4 w-4" />}
              />
              <Input
                label="Confirm New Password"
                type="password"
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                leftIcon={<Lock className="h-4 w-4" />}
              />
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Link href="/settings">
              <Button type="button" variant="outline" disabled={saving}>
                Cancel
              </Button>
            </Link>
            <Button type="submit" loading={saving} size="lg">
              <Save className="h-4 w-4 mr-1.5" /> Save Changes
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
