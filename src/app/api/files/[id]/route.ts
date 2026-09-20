import { NextRequest, NextResponse } from "next/server";
import { transaction } from "@/lib/store";
import { AppError, requireSession } from "@/lib/auth";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    return await transaction(async (store) => {
      const { room } = await requireSession(store, request);
      const file = await store.get<{
        roomId: string;
        mime: string;
        base64: string;
      }>("file", id);
      if (!file || file.roomId !== room.id)
        throw new AppError("File not found.", 404);
      return new NextResponse(
        new Uint8Array(Buffer.from(file.base64, "base64")),
        {
          headers: {
            "Content-Type": file.mime,
            "Cache-Control": "private, no-store",
            "X-Content-Type-Options": "nosniff",
          },
        },
      );
    });
  } catch (e) {
    return NextResponse.json(
      { error: "File unavailable." },
      { status: e instanceof AppError ? e.status : 503 },
    );
  }
}
