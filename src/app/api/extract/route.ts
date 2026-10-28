import { NextResponse } from "next/server";
import { extractWithDeepSeek, getAiStatus } from "@/lib/deepseek-extractor";
import { todayIso } from "@/lib/dates";
import { extractLocally } from "@/lib/local-extractor";
import {
  extractRequestSchema,
  type ExtractResponse,
} from "@/lib/schema";

export const maxDuration = 60;

export async function GET() {
  const status = getAiStatus();
  return NextResponse.json({
    engine: status.configured ? "deepseek" : "local",
    model: status.model,
    schemaVersion: "1.0",
  });
}

export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { error: "The request body must be valid JSON." },
      { status: 400 },
    );
  }

  const parsed = extractRequestSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Check the meeting details and try again.",
        issues: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const meetingDate = parsed.data.meetingDate ?? todayIso();
  const warnings: string[] = [];
  const aiStatus = getAiStatus();

  if (aiStatus.configured) {
    try {
      const result = await extractWithDeepSeek(
        parsed.data.transcript,
        meetingDate,
        parsed.data.title,
      );

      const response: ExtractResponse = {
        analysis: result.analysis,
        engine: "deepseek",
        model: result.model,
        warnings,
      };

      return NextResponse.json(response);
    } catch (error) {
      console.error("[extract] DeepSeek extraction failed:", error);
      warnings.push(
        "AI extraction was unavailable, so a local preview was generated. Review owners and dates before sharing.",
      );
    }
  } else {
    warnings.push(
      "Running the local preview engine. Add DEEPSEEK_API_KEY for higher-fidelity extraction.",
    );
  }

  const response: ExtractResponse = {
    analysis: extractLocally(
      parsed.data.transcript,
      meetingDate,
      parsed.data.title,
    ),
    engine: "local",
    model: null,
    warnings,
  };

  return NextResponse.json(response);
}
