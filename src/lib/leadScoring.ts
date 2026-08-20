import { LeadWithRelations } from "@/types";

export interface LeadScoreInfo {
  score: number; // 0 - 100
  category: "HOT" | "WARM" | "COLD";
  label: string;
  reasons: string[];
}

export function computeLeadScore(lead: LeadWithRelations): LeadScoreInfo {
  let score = 30; // base score
  const reasons: string[] = [];

  // Status weight
  switch (lead.status) {
    case "CONVERTED":
      score = 100;
      reasons.push("Deal closed & converted");
      break;
    case "SITE_VISIT":
      score += 40;
      reasons.push("Site visit / Demo scheduled");
      break;
    case "FOLLOW_UP":
      score += 25;
      reasons.push("Active follow-up discussion");
      break;
    case "INTERESTED":
      score += 20;
      reasons.push("Expressed positive interest");
      break;
    case "CONTACTED":
      score += 10;
      reasons.push("Initial contact established");
      break;
    case "LOST":
      score = 10;
      reasons.push("Marked as lost or dropped");
      break;
    case "NEW":
    default:
      score += 5;
      reasons.push("Fresh incoming lead");
      break;
  }

  // Requirement completeness bonus
  if (lead.field1Value && lead.field2Value) {
    score += 10;
    reasons.push("Detailed requirements specified");
  }
  if (lead.email && lead.phone) {
    score += 5;
  }

  // Activity engagement bonus
  if (lead.activities && lead.activities.length > 0) {
    const activityBonus = Math.min(lead.activities.length * 5, 20);
    score += activityBonus;
    reasons.push(`${lead.activities.length} communication touchpoints`);
  }

  // Next follow-up recency
  if (lead.nextFollowupAt) {
    const nextDate = new Date(lead.nextFollowupAt).getTime();
    const now = Date.now();
    if (nextDate >= now - 86400000 && nextDate <= now + 86400000 * 3) {
      score += 5;
      reasons.push("Active near-term follow-up pending");
    }
  }

  // Clamp 0 to 100
  score = Math.max(0, Math.min(100, score));

  let category: "HOT" | "WARM" | "COLD" = "COLD";
  let label = "Cold Lead";

  if (score >= 70) {
    category = "HOT";
    label = "Hot Lead 🔥";
  } else if (score >= 40) {
    category = "WARM";
    label = "Warm Lead ⚡";
  } else {
    category = "COLD";
    label = "Cold Lead ❄️";
  }

  return {
    score,
    category,
    label,
    reasons,
  };
}
