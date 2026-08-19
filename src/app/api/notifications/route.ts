import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { getNotifications, markAllNotificationsRead } from "@/server/notifications/service";

export async function GET() {
  try {
    const session = await requireSession();
    const result = await getNotifications(session.businessId, session.userId);
    return NextResponse.json(result);
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
  }
}

export async function PATCH() {
  try {
    const session = await requireSession();
    await markAllNotificationsRead(session.businessId, session.userId);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to mark notifications read" }, { status: 500 });
  }
}
