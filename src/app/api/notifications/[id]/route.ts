import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { markNotificationRead } from "@/server/notifications/service";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireSession();
    const id = parseInt(params.id, 10);
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid notification ID" }, { status: 400 });
    }

    await markNotificationRead(session.businessId, session.userId, id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to update notification" }, { status: 500 });
  }
}
