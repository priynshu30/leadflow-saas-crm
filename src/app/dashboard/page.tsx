"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { CardSkeleton, TableSkeleton } from "@/components/ui/LoadingSkeleton";
import { CompleteFollowUpModal } from "@/components/followups/CompleteFollowUpModal";
import { LeadTrendChart } from "@/components/charts/LeadTrendChart";
import { DashboardStats, FollowUpItem, LeadWithRelations } from "@/types";
import { getWhatsAppLink, getCallLink, formatIndianPhone, formatDateTime, formatDate } from "@/lib/utils";
import {
  Users,
  UserPlus,
  TrendingUp,
  CalendarClock,
  CheckCircle2,
  Phone,
  MessageSquare,
  ArrowRight,
  Sparkles,
  Clock,
  Plus,
} from "lucide-react";

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [weeklyTrend, setWeeklyTrend] = useState<any[]>([]);
  const [recentLeads, setRecentLeads] = useState<LeadWithRelations[]>([]);
  const [urgentFollowUps, setUrgentFollowUps] = useState<FollowUpItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedFollowUp, setSelectedFollowUp] = useState<FollowUpItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/dashboard");
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
        setWeeklyTrend(data.weeklyTrend || []);
        setRecentLeads(data.recentLeads || []);
        setUrgentFollowUps(data.urgentFollowUps || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    const handleLeadAdded = () => fetchDashboardData();
    window.addEventListener("lead-added", handleLeadAdded);
    return () => window.removeEventListener("lead-added", handleLeadAdded);
  }, []);

  if (loading && !stats) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-slate-200 animate-pulse rounded-lg" />
        <CardSkeleton count={4} />
        <TableSkeleton rows={4} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Sales Dashboard</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Core promise: "Never miss a follow-up"
          </p>
        </div>

        <Link href="/leads/new">
          <Button size="sm">
            <Plus className="h-4 w-4 mr-1.5" /> Add New Lead
          </Button>
        </Link>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Leads */}
        <Card className="border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Leads</span>
            <div className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">{stats?.totalLeads || 0}</p>
          <p className="text-[11px] text-slate-400 mt-1">Across all pipelines</p>
        </Card>

        {/* Follow Ups Due Today & Overdue */}
        <Card
          className={`border ${
            (stats?.followUpsDue || 0) > 0 ? "border-amber-200 bg-amber-50/20" : "border-slate-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Follow-Ups Due</span>
            <div className="h-8 w-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
              <CalendarClock className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-amber-900 mt-2">
            {stats?.followUpsDue || 0}
          </p>
          <p className="text-[11px] text-amber-700 font-medium mt-1">
            {stats?.overdueFollowUps || 0} overdue • {stats?.todayFollowUps || 0} today
          </p>
        </Card>

        {/* Interested Active Pipeline */}
        <Card className="border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Hot Pipeline</span>
            <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
            {stats?.interestedLeads || 0}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Interested & Site Visits</p>
        </Card>

        {/* Converted Leads */}
        <Card className="border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Converted</span>
            <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-emerald-600 mt-2">
            {stats?.convertedLeads || 0}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Closed deals</p>
        </Card>
      </div>

      {/* 7-Day Inflow Trends Card */}
      <Card>
        <CardHeader className="flex items-center justify-between">
          <div>
            <CardTitle>7-Day Lead Velocity & Conversion Trends</CardTitle>
            <p className="text-xs text-slate-500 mt-0.5">Daily trend of incoming enquiries vs deals closed</p>
          </div>
          <Link
            href="/reports"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
          >
            Full Analytics <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </CardHeader>
        <LeadTrendChart data={weeklyTrend} />
      </Card>

      {/* Main Grid: Urgent Follow-ups & Recent Leads */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Urgent Follow-ups Due */}
        <Card className="flex flex-col justify-between">
          <div>
            <CardHeader className="flex items-center justify-between">
              <div>
                <CardTitle>Follow-Ups Requiring Action</CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">Overdue & scheduled for today</p>
              </div>
              <Link
                href="/follow-ups"
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </CardHeader>

            {urgentFollowUps.length === 0 ? (
              <EmptyState
                icon={<Sparkles className="h-6 w-6 text-emerald-600" />}
                title="All caught up!"
                description="You have no pending follow-ups due today. Great job keeping the pipeline warm!"
              />
            ) : (
              <div className="divide-y divide-slate-100">
                {urgentFollowUps.map((item) => {
                  const lead = item.lead;
                  const whatsappUrl = lead
                    ? getWhatsAppLink(lead.phone, `Hello ${lead.name}, following up regarding your requirement...`)
                    : "#";
                  const callUrl = lead ? getCallLink(lead.phone) : "#";

                  return (
                    <div key={item.id} className="py-3.5 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        {lead && (
                          <Link
                            href={`/leads/${lead.id}`}
                            className="font-bold text-sm text-slate-900 hover:text-indigo-600 hover:underline truncate block"
                          >
                            {lead.name}
                          </Link>
                        )}
                        <p className="text-xs text-slate-500 font-mono mt-0.5">
                          {lead ? formatIndianPhone(lead.phone) : "—"}
                        </p>
                        <div className="flex items-center gap-1.5 text-[11px] text-amber-700 font-medium mt-1">
                          <Clock className="h-3 w-3" />
                          <span>{formatDateTime(item.scheduledAt)}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {lead && (
                          <>
                            <a
                              href={whatsappUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white flex items-center justify-center transition-colors"
                              title="WhatsApp"
                            >
                              <MessageSquare className="h-4 w-4" />
                            </a>
                            <a
                              href={callUrl}
                              className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white flex items-center justify-center transition-colors"
                              title="Call"
                            >
                              <Phone className="h-4 w-4" />
                            </a>
                          </>
                        )}
                        <Button
                          size="sm"
                          variant="success"
                          onClick={() => {
                            setSelectedFollowUp(item);
                            setIsModalOpen(true);
                          }}
                        >
                          Done
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Card>

        {/* Recently Updated Leads */}
        <Card className="flex flex-col justify-between">
          <div>
            <CardHeader className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Leads</CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">Recently added or updated prospects</p>
              </div>
              <Link
                href="/leads"
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </CardHeader>

            {recentLeads.length === 0 ? (
              <EmptyState
                icon={<UserPlus className="h-6 w-6 text-indigo-600" />}
                title="No leads added yet"
                description="Start adding leads using the Quick Add button to build your pipeline."
              />
            ) : (
              <div className="divide-y divide-slate-100">
                {recentLeads.map((lead) => (
                  <div key={lead.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        href={`/leads/${lead.id}`}
                        className="font-bold text-sm text-slate-900 hover:text-indigo-600 hover:underline truncate block"
                      >
                        {lead.name}
                      </Link>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">{formatIndianPhone(lead.phone)}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge status={lead.status} size="sm" />
                      <Link
                        href={`/leads/${lead.id}`}
                        className="h-8 w-8 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center justify-center transition-colors"
                      >
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Complete Follow-up Modal */}
      <CompleteFollowUpModal
        followUp={selectedFollowUp}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedFollowUp(null);
        }}
        onCompleted={fetchDashboardData}
      />
    </div>
  );
}
