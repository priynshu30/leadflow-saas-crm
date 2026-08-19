"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { ReportData, LeadStatus } from "@/types";
import { CardSkeleton } from "@/components/ui/LoadingSkeleton";
import { LeadTrendChart } from "@/components/charts/LeadTrendChart";
import { SourcePieChart } from "@/components/charts/SourcePieChart";
import { ActivityBarChart } from "@/components/charts/ActivityBarChart";
import { FunnelChart } from "@/components/charts/FunnelChart";
import {
  TrendingUp,
  CheckCircle2,
  XCircle,
  PieChart,
  Layers,
  Calendar,
  PhoneCall,
  Activity,
} from "lucide-react";

export default function ReportsPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/reports")
      .then((res) => res.json())
      .then((d) => setData(d))
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-slate-200 animate-pulse rounded-lg" />
        <CardSkeleton count={3} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-72 bg-slate-200 animate-pulse rounded-xl" />
          <div className="h-72 bg-slate-200 animate-pulse rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Analytics & Data Trends
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Visual insights into lead generation speed, pipeline velocity, outreach volume, and channel sources
        </p>
      </div>

      {/* Top Conversion KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-indigo-100 bg-indigo-50/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-900 uppercase tracking-wider">
              Win / Conversion Rate
            </span>
            <div className="h-8 w-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-indigo-600 mt-2">{data.conversionRate}%</p>
          <p className="text-[11px] text-indigo-800 mt-1">
            {data.convertedCount} won of {data.totalLeads} total prospects
          </p>
        </Card>

        <Card className="border-emerald-100 bg-emerald-50/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
              Deals Converted
            </span>
            <div className="h-8 w-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-emerald-600 mt-2">{data.convertedCount}</p>
          <p className="text-[11px] text-emerald-800 mt-1">Successfully closed transactions</p>
        </Card>

        <Card className="border-rose-100 bg-rose-50/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-900 uppercase tracking-wider">
              Deals Lost / Inactive
            </span>
            <div className="h-8 w-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
              <XCircle className="h-4 w-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-rose-600 mt-2">{data.lostCount}</p>
          <p className="text-[11px] text-rose-800 mt-1">Drop-offs & unqualified leads</p>
        </Card>
      </div>

      {/* Row 1: Lead Inflow Trend & Conversion Funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lead Inflow Trend (14-Day Growth) */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>14-Day Lead Growth & Inflow Trend</CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">Daily new enquiries vs deals won</p>
            </div>
            <Activity className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <LeadTrendChart data={data.leadTrends || []} />
        </Card>

        {/* Conversion Funnel */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Deal Pipeline Funnel</CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">Stage progression and conversion drop-offs</p>
            </div>
            <Layers className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <FunnelChart
            stages={data.funnelStages || []}
            totalLeads={data.totalLeads}
          />
        </Card>
      </div>

      {/* Row 2: Sources Donut & Weekly Outreach Volume */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sources Donut Chart */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Acquisition Channel Distribution</CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">Where your highest volume leads come from</p>
            </div>
            <PieChart className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <SourcePieChart data={data.leadsBySource} />
        </Card>

        {/* Weekly Outreach Activity */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>7-Day Sales Outreach Volume</CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">Calls, WhatsApp engagements, and client notes</p>
            </div>
            <PhoneCall className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <ActivityBarChart data={data.activityTrends || []} />
        </Card>
      </div>
    </div>
  );
}
