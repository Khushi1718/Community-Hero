import { IIntegrationConfig } from "@/models/IntegrationConfig";
import { WebhookLog } from "@/models/WebhookLog";
import { WebhookFailure } from "@/models/WebhookFailure";
import { buildCRMPayload } from "./buildPayload";
import { decryptToken } from "./crypto";

const MAX_RETRIES = 3;
// Exponential backoff delays in ms: 1s, 4s, 9s
const getBackoffDelay = (attempt: number) => attempt * attempt * 1000; 

export async function pushToExternalCRM(ticket: any, config: IIntegrationConfig) {
  if (!config.enabled || !config.webhookUrl) return;

  const payload = buildCRMPayload(ticket, config);
  const cityId = config.cityId;
  const ticketId = ticket.issueId || ticket._id.toString();

  // Prepare Headers
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (config.authType !== 'none' && config.authTokenEncrypted) {
    try {
      const token = decryptToken(config.authTokenEncrypted);
      if (config.authType === 'bearer') {
        headers['Authorization'] = `Bearer ${token}`;
      } else if (config.authType === 'basic') {
        headers['Authorization'] = `Basic ${token}`;
      } else if (config.authType === 'apiKey') {
        headers['x-api-key'] = token;
      }
    } catch (e) {
      console.error("Failed to decrypt webhook auth token", e);
      // Proceeding without auth header or fail? We should fail gracefully.
    }
  }

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(config.webhookUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      const responseBody = await response.text();

      // Log success
      await WebhookLog.create({
        ticketId,
        cityId,
        endpoint: config.webhookUrl,
        status: response.ok ? 'success' : 'failure',
        responseCode: response.status,
        responseBody: responseBody.substring(0, 1000), // truncate long responses
      });

      if (response.ok) {
        return; // Success, exit retry loop
      } else if (attempt === MAX_RETRIES) {
        // Final failure after receiving a bad status code
        throw new Error(`Webhook returned status ${response.status}: ${responseBody}`);
      }
    } catch (error: any) {
      // Log connection error
      await WebhookLog.create({
        ticketId,
        cityId,
        endpoint: config.webhookUrl,
        status: 'failure',
        errorMessage: error.message,
      });

      if (attempt === MAX_RETRIES) {
        // Final failure logging
        await WebhookFailure.create({
          ticketId,
          cityId,
          error: error.message,
          attempts: attempt,
        });
        return; // exit cleanly
      }

      // Wait before next attempt
      const delay = getBackoffDelay(attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
