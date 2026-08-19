"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { FollowUpItem } from "@/types";
import { useToast } from "@/components/ui/Toast";
import { CheckCircle2, Calendar } from "lucide-react";

interface CompleteFollowUpModalProps {
  followUp: FollowUpItem | null;
  isOpen: boolean;
  onClose: () => void;
  onCompleted?: () => void;
}

export const CompleteFollowUpModal: React.FC<CompleteFollowUpModalProps> = ({
  followUp,
  isOpen,
  onClose,
  onCompleted,
}) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState("");
  const [scheduleNext, setScheduleNext] = useState(true);
  const [nextDate, setNextDate] = useState("");
  const [nextTime, setNextTime] = useState("11:00");

  React.useEffect(() => {
    if (isOpen) {
      const target = new Date();
      target.setDate(target.getDate() + 2); // Default next follow-up in 2 days
      setNextDate(target.toISOString().split("T")[0]);
      setNote("");
    }
  }, [isOpen]);

  if (!followUp) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let nextFollowupAt = null;
      if (scheduleNext && nextDate) {
        nextFollowupAt = new Date(`${nextDate}T${nextTime || "10:00"}:00`).toISOString();
      }

      const res = await fetch(`/api/follow-ups/${followUp.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "DONE",
          note: note.trim() || null,
          nextFollowupAt,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to complete follow-up");
      }

      showToast("Follow-up marked as completed!", "success");
      onClose();
      if (onCompleted) onCompleted();
    } catch (err: any) {
      showToast(err.message || "Failed to update follow-up", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Complete Follow-Up"
      description={`Mark follow-up for ${followUp.lead?.name || "Lead"} as done`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Follow-up Outcome / Call Notes
          </label>
          <textarea
            rows={2}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            placeholder="e.g. Discussed budget, requested brochure, interested in 3BHK..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        {/* Schedule next follow up block */}
        <div className="p-3.5 rounded-xl border border-indigo-100 bg-indigo-50/50 space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-indigo-950 flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={scheduleNext}
                onChange={(e) => setScheduleNext(e.target.checked)}
                className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
              />
              Schedule Next Follow-Up
            </label>
            <span className="text-[11px] text-indigo-600 font-medium">Core rule: Keep lead warm</span>
          </div>

          {scheduleNext && (
            <div className="grid grid-cols-2 gap-3 pt-1">
              <Input
                type="date"
                label="Next Date"
                value={nextDate}
                onChange={(e) => setNextDate(e.target.value)}
                required={scheduleNext}
              />
              <Input
                type="time"
                label="Next Time"
                value={nextTime}
                onChange={(e) => setNextTime(e.target.value)}
                required={scheduleNext}
              />
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="success" loading={loading}>
            <CheckCircle2 className="h-4 w-4 mr-1.5" /> Mark Done
          </Button>
        </div>
      </form>
    </Modal>
  );
};
