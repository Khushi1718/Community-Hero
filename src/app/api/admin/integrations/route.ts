import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongoose";
import { IntegrationConfig } from "@/models/IntegrationConfig";
import { WebhookLog } from "@/models/WebhookLog";
import { encryptToken, decryptToken } from "@/lib/integrations/crypto";

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const cityId = searchParams.get('cityId');

    if (!cityId) {
      return NextResponse.json({ error: "cityId is required" }, { status: 400 });
    }

    const config = await IntegrationConfig.findOne({ cityId });
    const logs = await WebhookLog.find({ cityId }).sort({ timestamp: -1 }).limit(10);

    return NextResponse.json({
      config: config ? {
        id: config._id,
        cityId: config.cityId,
        enabled: config.enabled,
        webhookUrl: config.webhookUrl === "https://unconfigured-webhook.local" ? "" : config.webhookUrl,
        authType: config.authType,
        hasAuthToken: !!config.authTokenEncrypted,
        fieldMapping: config.fieldMapping,
        pubSubEnabled: config.pubSubEnabled,
        pubSubTopic: config.pubSubTopic,
        hasPubSubKey: !!config.pubSubServiceAccountKeyEncrypted,
        lastModifiedBy: config.lastModifiedBy,
        lastModifiedAt: config.lastModifiedAt
      } : null,
      logs
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const body = await request.json();
    const { cityId, enabled, webhookUrl, authType, authToken, fieldMapping, pubSubEnabled, pubSubTopic, pubSubServiceAccountKey, lastModifiedBy } = body;

    if (!cityId) {
      return NextResponse.json({ error: "cityId is required" }, { status: 400 });
    }
    
    if (pubSubEnabled && pubSubTopic) {
      const topicRegex = /^projects\/[^/]+\/topics\/[^/]+$/;
      if (!topicRegex.test(pubSubTopic)) {
        return NextResponse.json({ error: "Invalid Pub/Sub topic format. Must be projects/{project}/topics/{topic}" }, { status: 400 });
      }
    }

    let config = await IntegrationConfig.findOne({ cityId });

    if (!config) {
      config = new IntegrationConfig({ cityId });
    }

    config.enabled = !!enabled;
    config.webhookUrl = webhookUrl || "https://unconfigured-webhook.local";
    config.authType = authType || "none";

    // Only update authToken if a new one is provided. Otherwise keep existing.
    if (authToken && authToken.trim() !== '') {
      config.authTokenEncrypted = encryptToken(authToken.trim());
    }

    if (fieldMapping) {
      config.fieldMapping = fieldMapping;
    }
    
    config.pubSubEnabled = !!pubSubEnabled;
    if (pubSubTopic !== undefined) config.pubSubTopic = pubSubTopic;
    
    if (pubSubServiceAccountKey && pubSubServiceAccountKey.trim() !== '') {
      config.pubSubServiceAccountKeyEncrypted = encryptToken(pubSubServiceAccountKey.trim());
    }

    if (lastModifiedBy) {
      config.lastModifiedBy = lastModifiedBy;
      config.lastModifiedAt = new Date();
    }

    await config.save();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
