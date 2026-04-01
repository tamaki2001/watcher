import { NextRequest, NextResponse } from "next/server";

const GITHUB_PAT = process.env.GITHUB_PAT!;
const REPO = "tamaki2001/watcher";
const DISPATCH_URL = `https://api.github.com/repos/${REPO}/dispatches`;

const VALID_EVENTS = [
  "buy_1",
  "buy_2",
  "buy_3",
  "buy_carton",
  "unlock_request",
  "proximity_alert",
];

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { event_type, client_payload } = body;

  if (!event_type || !VALID_EVENTS.includes(event_type)) {
    return NextResponse.json(
      { error: "無効なevent_type" },
      { status: 400 }
    );
  }

  const dispatchBody: Record<string, unknown> = { event_type };
  if (client_payload) {
    dispatchBody.client_payload = client_payload;
  }

  const res = await fetch(DISPATCH_URL, {
    method: "POST",
    headers: {
      Accept: "application/vnd.github.v3+json",
      Authorization: `Bearer ${GITHUB_PAT}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(dispatchBody),
  });

  if (res.status === 204) {
    return NextResponse.json({ ok: true });
  }

  const text = await res.text();
  return NextResponse.json(
    { error: "GitHub API error", detail: text },
    { status: res.status }
  );
}
