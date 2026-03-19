import { NextRequest, NextResponse } from "next/server";
import { analyzeVideo } from "@/lib/video-analysis";

export async function GET(request: NextRequest) {
  const rawUrl = request.nextUrl.searchParams.get("url") ?? "";

  try {
    const report = await analyzeVideo(rawUrl);
    return NextResponse.json(report);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to analyze video.";
    const status = message === "Invalid video URL." ? 400 : 502;

    return NextResponse.json({ error: message }, { status });
  }
}
