import { NextRequest, NextResponse } from "next/server";

import { getSectorResearch } from "@/lib/data";

export async function GET(request: NextRequest) {
  const tradeDate = request.nextUrl.searchParams.get("tradeDate");
  const sectorCode = request.nextUrl.searchParams.get("sectorCode");

  if (!tradeDate || !sectorCode) {
    return NextResponse.json(
      { ok: false, error: "缺少参数 tradeDate 或 sectorCode" },
      { status: 400 }
    );
  }

  try {
    const data = await getSectorResearch(tradeDate, sectorCode);
    return NextResponse.json({ ok: true, data });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
