import { NextRequest, NextResponse } from "next/server";

const METACOMP_BASE = "https://www.metacomp.ai";
const METACOMP_API_KEY = process.env.METACOMP_API_KEY ?? "";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { network, address } = body;

    if (!network || !address) {
      return NextResponse.json(
        { error: "Missing required fields: network and address" },
        { status: 400 }
      );
    }

    const response = await fetch(`${METACOMP_BASE}/api/v1/walletCheck`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${METACOMP_API_KEY}`,
      },
      body: JSON.stringify({ network, walletAddress: address }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `MetaComp API error: ${response.status}`, details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Wallet check error:", error);
    return NextResponse.json(
      { error: "Internal server error while checking wallet" },
      { status: 500 }
    );
  }
}
