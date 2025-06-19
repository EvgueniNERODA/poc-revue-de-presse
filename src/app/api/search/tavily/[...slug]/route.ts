import { NextResponse, type NextRequest } from "next/server";
import { TAVILY_BASE_URL } from "@/constants/urls";

export const runtime = "edge";
export const preferredRegion = [
  "cle1",
  "iad1",
  "pdx1",
  "sfo1",
  "sin1",
  "syd1",
  "hnd1",
  "kix1",
];

const API_PROXY_BASE_URL = process.env.TAVILY_API_BASE_URL || TAVILY_BASE_URL;

export async function POST(req: NextRequest) {
  const body = await req.json();
  const searchParams = req.nextUrl.searchParams;
  const path = searchParams.getAll("slug");
  searchParams.delete("slug");
  const params = searchParams.toString();

  // Use server-side API key if no Authorization header is provided
  const authHeader =
    req.headers.get("Authorization") || `Bearer ${process.env.TAVILY_API_KEY}`;

  if (
    !authHeader ||
    (!authHeader.includes("Bearer") && !process.env.TAVILY_API_KEY)
  ) {
    return NextResponse.json({ error: "API key is required" }, { status: 401 });
  }

  try {
    let url = `${API_PROXY_BASE_URL}/${decodeURIComponent(path.join("/"))}`;
    if (params) url += `?${params}`;
    const payload: RequestInit = {
      method: req.method,
      headers: {
        "Content-Type": req.headers.get("Content-Type") || "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify(body),
    };
    console.log("Payload => ", payload);
    console.log("URL => ", url);

    const response = await fetch(url, payload);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Tavily API Error:", response.status, errorText);
      return NextResponse.json(
        { error: `Tavily API error: ${response.status}`, details: errorText },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Proxy error:", error);
    if (error instanceof Error) {
      return NextResponse.json(
        { error: "Internal server error", message: error.message },
        { status: 500 },
      );
    }
    return NextResponse.json(
      { error: "Unknown error occurred" },
      { status: 500 },
    );
  }
}
