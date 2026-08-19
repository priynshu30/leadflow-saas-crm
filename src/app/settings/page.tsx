"use client";

import React from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Building2, User, Sliders, ShieldCheck, ArrowRight, Bell } from "lucide-react";

export default function SettingsHubPage() {
  const sections = [
    {
      title: "Business Profile & Niche Fields",
      description: "Customize your industry vertical and rename the 4 generic lead requirement fields",
      href: "/settings/business",
      icon: Sliders,
    },
    {
      title: "User Profile",
      description: "Manage your personal account details, display name, and login credentials",
      href: "/settings/profile",
      icon: User,
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Settings & Customization</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure your multi-tenant workspace, niche field labels, and profile
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <Link key={section.href} href={section.href} className="group">
              <Card hoverEffect className="h-full flex flex-col justify-between p-6">
                <div className="space-y-3">
                  <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base group-hover:text-indigo-600 transition-colors">
                      {section.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">{section.description}</p>
                  </div>
                </div>

                <div className="flex items-center text-xs font-semibold text-indigo-600 gap-1 pt-4 border-t border-slate-100 mt-4">
                  <span>Configure</span>
                  <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
