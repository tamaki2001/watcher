import { NextRequest, NextResponse } from "next/server";

const GITHUB_PAT = process.env.GITHUB_PAT!;
const REPO = process.env.GITHUB_REPO || process.env.NEXT_PUBLIC_GITHUB_REPO || "tamaki2001/watcher";
const WORKFLOW_URL = `https://api.github.com/repos/${REPO}/actions/workflows/watcher.yml/dispatches`;

const EVENT_MAP: Record<string, { action: string; quantity?: string }> = {
  buy_1:      { action: "report_purchase", quantity: "1" },
  buy_2:      { action: "report_purchase", quantity: "2" },
  buy_3:      { action: "report_purchase", quantity: "3" },
  buy_carton: { action: "report_purchase", quantity: "10" },
  unlock_request: { action: "request_unlock" },
};

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { event_type, client_payload } = body;

  const mapping = EVENT_MAP[event_type];
  if (!mapping) {
    return NextResponse.json(
      { error: "無効なevent_type" },
      { status: 400 }
    );
  }

  const inputs: Record<string, string> = { action: mapping.action };
  if (mapping.quantity) inputs.quantity = mapping.quantity;
  if (event_type === "unlock_request" && client_payload?.url) {
    inputs.redemption_url = client_payload.url;
  }

  const res = await fetch(WORKFLOW_URL, {
    method: "POST",
    headers: {
      Accept: "application/vnd.github.v3+json",
      Authorization: `Bearer ${GITHUB_PAT}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ref: "main", inputs }),
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
