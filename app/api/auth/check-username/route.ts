import { NextResponse } from "next/server";
import { isUsernameAvailable, normalizeUsername, validateUsername } from "@/lib/auth-validation";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawUsername = searchParams.get("username") ?? "";
  const username = normalizeUsername(rawUsername);

  if (username.length > 20) {
    return NextResponse.json(
      {
        available: false,
        reason: "Username is too long."
      },
      { status: 400 }
    );
  }

  const validation = validateUsername(username);

  if (!validation.ok) {
    return NextResponse.json(
      {
        available: false,
        reason: validation.reason
      },
      { status: 200 }
    );
  }

  const availability = isUsernameAvailable(username);

  return NextResponse.json({
    available: availability.available,
    reason: availability.reason
  });
}
