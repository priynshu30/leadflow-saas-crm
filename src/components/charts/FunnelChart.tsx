"use client";

import React from "react";
import { ArrowDown } from "lucide-react";

interface FunnelStage {
  stage: string;
  count: number;
  color: string;
}

interface FunnelChartProps {
  stages: FunnelStage[];
  totalLeads: number;
}

export const FunnelChart: React.FC<FunnelChartProps> = ({ stages, totalLeads }) => {
  if (!stages || stages.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-xs text-slate-400">
        No funnel data available
      </div>
    );
  }

  const maxCount = Math.max(...stages.map((s) => s.count), 1);

  return (
    <div className="space-y-4 py-2">
      {stages.map((item, idx) => {
        const percentOfTotal = totalLeads > 0 ? Math.round((item.count / totalLeads) * 100) : 0;
        const widthPercent = Math.max(12, Math.round((item.count / maxCount) * 100));

        return (
          <div key={item.stage} className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="font-semibold text-slate-800">{item.stage}</span>
              </div>
              <div className="flex items-center gap-2 font-mono text-xs">
                <span className="font-bold text-slate-900">{item.count}</span>
                <span className="text-[11px] text-slate-400">({percentOfTotal}%)</span>
              </div>
            </div>

            <div className="h-4 w-full rounded-lg bg-slate-100 overflow-hidden flex">
              <div
                className="h-full rounded-lg transition-all duration-500 shadow-2xs"
                style={{
                  width: `${widthPercent}%`,
                  backgroundColor: item.color,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};
