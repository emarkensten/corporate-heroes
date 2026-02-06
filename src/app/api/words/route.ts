import { NextRequest, NextResponse } from "next/server";
import { getWords, addWord, addWords, clearWords } from "@/lib/store";

// Simple in-memory rate limiter
const rateLimiter = globalThis as unknown as {
  requests: Map<string, { count: number; resetTime: number }>;
};

if (!rateLimiter.requests) {
  rateLimiter.requests = new Map();
}

const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
// Higher limit for demo scenarios where many users might share same IP (corporate network/NAT)
const RATE_LIMIT_MAX_REQUESTS = process.env.NODE_ENV === "production" ? 300 : 500;

function getClientIP(request: NextRequest): string {
  // Try various headers for the real IP
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIP = request.headers.get("x-real-ip");
  if (realIP) {
    return realIP;
  }
  // Fallback - in dev this will be the same for all requests
  return "unknown";
}

function checkRateLimit(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = rateLimiter.requests.get(ip);

  if (!entry || now > entry.resetTime) {
    // First request or window expired
    rateLimiter.requests.set(ip, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW_MS,
    });
    return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - 1 };
  }

  if (entry.count >= RATE_LIMIT_MAX_REQUESTS) {
    return { allowed: false, remaining: 0 };
  }

  entry.count++;
  return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - entry.count };
}

// Periodically clean up old rate limit entries
function cleanupRateLimiter(): void {
  const now = Date.now();
  for (const [ip, entry] of rateLimiter.requests.entries()) {
    if (now > entry.resetTime) {
      rateLimiter.requests.delete(ip);
    }
  }
}

export async function GET() {
  const words = getWords();
  return NextResponse.json({ words });
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = getClientIP(request);
    const { allowed, remaining } = checkRateLimit(ip);

    if (!allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Try again in a minute." },
        {
          status: 429,
          headers: {
            "X-RateLimit-Remaining": "0",
            "Retry-After": "60",
          },
        }
      );
    }

    const body = await request.json();

    // Support batch submission: { words: ["A", "B", "C"] }
    if (Array.isArray(body.words)) {
      const words = body.words
        .filter((w: unknown): w is string => typeof w === "string")
        .map((w: string) => w.trim())
        .filter((w: string) => w.length > 0 && w.length <= 50);

      if (words.length === 0) {
        return NextResponse.json(
          { error: "No valid words provided" },
          { status: 400 }
        );
      }

      // Limit batch size (80 allows full demo submissions)
      const limitedWords = words.slice(0, 80);
      const addedWords = addWords(limitedWords);

      // Cleanup rate limiter occasionally
      if (Math.random() < 0.1) cleanupRateLimiter();

      return NextResponse.json({
        success: true,
        added: addedWords.length,
        words: addedWords,
      }, {
        headers: {
          "X-RateLimit-Remaining": remaining.toString(),
        },
      });
    }

    // Single word submission: { word: "SYNERGY" }
    const { word } = body;

    if (!word || typeof word !== "string") {
      return NextResponse.json(
        { error: "Word is required" },
        { status: 400 }
      );
    }

    const trimmed = word.trim();
    if (trimmed.length === 0 || trimmed.length > 50) {
      return NextResponse.json(
        { error: "Word must be 1-50 characters" },
        { status: 400 }
      );
    }

    const newWord = addWord(trimmed);

    // Cleanup rate limiter occasionally
    if (Math.random() < 0.1) cleanupRateLimiter();

    if (!newWord) {
      // Word was a duplicate
      return NextResponse.json({
        success: true,
        duplicate: true,
        message: "Word already exists",
      }, {
        headers: {
          "X-RateLimit-Remaining": remaining.toString(),
        },
      });
    }

    return NextResponse.json({
      success: true,
      word: newWord,
    }, {
      headers: {
        "X-RateLimit-Remaining": remaining.toString(),
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  // Check for admin token or same-origin
  const adminToken = process.env.ADMIN_TOKEN;
  const authHeader = request.headers.get("authorization");
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");

  // Allow if:
  // 1. Admin token matches
  // 2. Same-origin request (origin matches host)
  // 3. No admin token configured (dev mode)
  const hasValidToken = adminToken && authHeader === `Bearer ${adminToken}`;
  const isSameOrigin = origin && host && (
    origin === `http://${host}` ||
    origin === `https://${host}` ||
    origin.includes("localhost") ||
    origin.includes("vercel.app")
  );
  const isDevMode = !adminToken;

  if (!hasValidToken && !isSameOrigin && !isDevMode) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  clearWords();
  return NextResponse.json({ success: true });
}
