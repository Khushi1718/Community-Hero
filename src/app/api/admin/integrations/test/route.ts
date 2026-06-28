import { NextRequest, NextResponse } from "next/server";
import { encryptToken, decryptToken } from "@/lib/integrations/crypto";

import { publishToPubSub } from "@/lib/integrations/publishToPubSub";

// Simple in-memory rate limiting (max 5 requests per minute per IP)
const rateLimitMap = new Map<string, { count: number, resetAt: number }>();

export async function POST(request: NextRequest) {
  try {
    // Rate Limiting
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const now = Date.now();
    const rateLimit = rateLimitMap.get(ip) || { count: 0, resetAt: now + 60000 };
    if (now > rateLimit.resetAt) {
      rateLimit.count = 0;
      rateLimit.resetAt = now + 60000;
    }
    rateLimit.count++;
    rateLimitMap.set(ip, rateLimit);
    if (rateLimit.count > 5) {
      return NextResponse.json({ error: "Rate limit exceeded. Please wait a minute before sending another test ping." }, { status: 429 });
    }

    const body = await request.json();
    const { 
      type, // 'webhook' or 'pubsub'
      webhookUrl, authType, authToken, existingEncryptedToken,
      pubSubTopic, pubSubServiceAccountKey, existingPubSubKeyEncrypted
    } = body;

    const payload = {
      test: true,
      message: "This is a test ping from Community Hero",
      timestamp: new Date().toISOString()
    };

    const startTime = Date.now();

    if (type === 'pubsub') {
      if (!pubSubTopic) {
        return NextResponse.json({ error: "pubSubTopic is required for Pub/Sub test" }, { status: 400 });
      }

      // Check format
      const topicRegex = /^projects\/[^/]+\/topics\/[^/]+$/;
      if (!topicRegex.test(pubSubTopic)) {
        return NextResponse.json({ error: "Invalid Pub/Sub topic format. Must be projects/{project}/topics/{topic}" }, { status: 400 });
      }

      let keyToUse = existingPubSubKeyEncrypted;
      if (pubSubServiceAccountKey && pubSubServiceAccountKey.trim() !== "") {
        keyToUse = encryptToken(pubSubServiceAccountKey.trim());
      }

      try {
        await publishToPubSub({
          topicName: pubSubTopic,
          payload,
          serviceAccountKeyEncrypted: keyToUse,
          issueId: "test-issue-123",
          eventType: "TEST_PING"
        }, 1);

        const durationMs = Date.now() - startTime;
        return NextResponse.json({ success: true, durationMs, body: "Pub/Sub message published successfully" });
      } catch (pubSubError: any) {
        return NextResponse.json({ success: false, status: 500, error: pubSubError.message, body: "Failed to publish to Pub/Sub" });
      }
    }

    // Default Webhook logic
    if (!webhookUrl) {
      return NextResponse.json({ error: "webhookUrl is required for webhook test" }, { status: 400 });
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    let tokenToUse = authToken;
    if (!tokenToUse && existingEncryptedToken) {
       tokenToUse = decryptToken(existingEncryptedToken);
    }

    if (authType !== 'none' && tokenToUse) {
      if (authType === 'bearer') {
        headers['Authorization'] = `Bearer ${tokenToUse}`;
      } else if (authType === 'basic') {
        headers['Authorization'] = `Basic ${tokenToUse}`;
      } else if (authType === 'apiKey') {
        headers['x-api-key'] = tokenToUse;
      }
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    const responseBody = await response.text();
    const durationMs = Date.now() - startTime;

    return NextResponse.json({ 
      success: response.ok,
      status: response.status,
      body: responseBody.substring(0, 500),
      durationMs
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
