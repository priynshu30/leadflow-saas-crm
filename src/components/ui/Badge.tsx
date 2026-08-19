import React from "react";
import { cn } from "@/lib/utils";
import { LeadStatus, FollowUpStatus } from "@/types";
import { LEAD_STATUS_CONFIG } from "@/lib/constants";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "status" | "followUpStatus" | "outline" | "success" | "warning" | "danger" | "info";
  status?: LeadStatus;
  followUpStatus?: FollowUpStatus;
  size?: "sm" | "md";
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = "default",
  status,
  followUpStatus,
  size = "md",
  children,
  ...props
}) => {
  const sizeStyles = {
    sm: "px-2 py-0.5 text-xs font-medium",
    md: "px-2.5 py-1 text-xs font-semibold",
  };

  if (status) {
    const config = LEAD_STATUS_CONFIG[status] || LEAD_STATUS_CONFIG.NEW;
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border shadow-2xs font-medium tracking-wide",
          config.bg,
          config.text,
          config.border,
          sizeStyles[size],
          className
        )}
        {...props}
      >
        <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", config.dot)} />
        {config.label}
      </span>
    );
  }

  if (followUpStatus) {
    const followUpStyles: Record<FollowUpStatus, { label: string; bg: string; text: string; border: string; dot: string }> = {
      PENDING: {
        label: "Pending",
        bg: "bg-amber-50",
        text: "text-amber-700",
        border: "border-amber-200",
        dot: "bg-amber-500",
      },
      DONE: {
        label: "Completed",
        bg: "bg-emerald-50",
        text: "text-emerald-700",
        border: "border-emerald-200",
        dot: "bg-emerald-500",
      },
      CANCELLED: {
        label: "Cancelled",
        bg: "bg-slate-100",
        text: "text-slate-600",
        border: "border-slate-200",
        dot: "bg-slate-400",
      },
    };

    const config = followUpStyles[followUpStatus];
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border shadow-2xs font-medium tracking-wide",
          config.bg,
          config.text,
          config.border,
          sizeStyles[size],
          className
        )}
        {...props}
      >
        <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", config.dot)} />
        {config.label}
      </span>
    );
  }

  const defaultVariants = {
    default: "bg-slate-100 text-slate-700 border-slate-200",
    outline: "bg-transparent text-slate-600 border-slate-300",
    success: "bg-emerald-50 text-emerald-700 border-emerald-200",
    warning: "bg-amber-50 text-amber-700 border-amber-200",
    danger: "bg-rose-50 text-rose-700 border-rose-200",
    info: "bg-indigo-50 text-indigo-700 border-indigo-200",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border shadow-2xs",
        defaultVariants[variant as keyof typeof defaultVariants] || defaultVariants.default,
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};
