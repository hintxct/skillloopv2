import { NextRequest, NextResponse } from "next/server";
import { transaction } from "@/lib/store";
import {
  AppError,
  assertDemo,
  checkOrigin,
  limit,
  requireSession,
} from "@/lib/auth";
import { uid } from "@/lib/seed";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: NextRequest) {
  try {
    checkOrigin(request);
    assertDemo();
    if (Number(request.headers.get("content-length") ?? 0) > 600000)
      throw new AppError("Choose an image under 512 KB.", 413);
    return await transaction(async (store) => {
      const { room, user } = await requireSession(store, request);
      await limit(store, `upload:${user.id}`, 10, 3600000);
      const form = await request.formData();
      const file = form.get("file");
      if (!(file instanceof File) || file.size > 512 * 1024)
        throw new AppError("Choose a JPEG, PNG or WebP image under 512 KB.");
      const bytes = Buffer.from(await file.arrayBuffer());
      const png = bytes
        .subarray(0, 8)
        .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
      const jpeg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
      const webp =
        bytes.subarray(0, 4).toString() === "RIFF" &&
        bytes.subarray(8, 12).toString() === "WEBP";
      const mime = png
        ? "image/png"
        : jpeg
          ? "image/jpeg"
          : webp
            ? "image/webp"
            : "";
      if (!mime || file.type !== mime)
        throw new AppError(
          "Unsupported or invalid image. Use JPEG, PNG or WebP.",
        );
      const fileId = uid();
      // Small demo avatars are stored persistently, never in ephemeral server files.
      // Large evidence uploads are deferred to scoped object storage in production.
      await store.put(
        "file",
        fileId,
        {
          roomId: room.id,
          ownerId: user.id,
          mime,
          base64: bytes.toString("base64"),
        },
        Date.now() + 14 * 86400000,
      );
      return NextResponse.json(
        { url: `/api/files/${fileId}` },
        { headers: { "Cache-Control": "no-store" } },
      );
    });
  } catch (e) {
    return NextResponse.json(
      {
        error:
          e instanceof AppError
            ? e.message
            : "Upload unavailable. Please try a smaller image.",
      },
      { status: e instanceof AppError ? e.status : 503 },
    );
  }
}
