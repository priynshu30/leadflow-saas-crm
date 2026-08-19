"use client";

import React, { useState, useEffect, useCallback } from "react";
import { FollowUpBuckets } from "@/components/followups/FollowUpBuckets";
import { FollowUpBucket, FollowUpItem } from "@/types";
import { TableSkeleton } from "@/components/ui/LoadingSkeleton";
import { CalendarClock, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function FollowUpsPage() {
  const [bucket, setBucket] = useState<FollowUpBucket>("today");
  const [followUps, setFollowUps] = useState<FollowUpItem[]>([]);
  const [counts, setCounts] = useState({
    overdue: 0,
    today: 0,
    tomorrow: 0,
    upcoming: 0,
    completed: 0,
    totalPending: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchFollowUps = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/follow-ups?bucket=${bucket}`);
      if (res.ok) {
        const data = await res.json();
        setFollowUps(data.followUps || []);
        if (data.counts) {
          setCounts(data.counts);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [bucket]);

  useEffect(() => {
    fetchFollowUps();

    const handleLeadAdded = () => fetchFollowUps();
    window.addEventListener("lead-added", handleLeadAdded);
    return () => window.removeEventListener("lead-added", handleLeadAdded);
  }, [fetchFollowUps]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Follow-Up Pipeline</h1>
            {counts.overdue > 0 && (
              <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700 text-xs font-bold">
                {counts.overdue} Overdue
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Core promise: "Never miss a follow-up"
          </p>
        </div>

        <Button size="sm" variant="outline" onClick={fetchFollowUps} disabled={loading}>
          <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      {loading && followUps.length === 0 ? (
        <TableSkeleton rows={5} />
      ) : (
        <FollowUpBuckets
          bucket={bucket}
          onBucketChange={setBucket}
          followUps={followUps}
          counts={counts}
          onRefresh={fetchFollowUps}
        />
      )}
    </div>
  );
}
