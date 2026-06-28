import { PubSub } from '@google-cloud/pubsub';
import { PubSubFailure } from '@/models/PubSubFailures';
import { decryptToken } from './crypto';
import connectToDatabase from '@/lib/mongoose';

interface PublishOptions {
  topicName: string;
  payload: any;
  serviceAccountKeyEncrypted?: string;
  issueId: string;
  eventType?: string;
}

// Implement retry with exponential backoff
const MAX_RETRIES = 3;
const INITIAL_BACKOFF_MS = 1000; // 1 second

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function publishToPubSub(options: PublishOptions, attempt = 1): Promise<void> {
  const { topicName, payload, serviceAccountKeyEncrypted, issueId, eventType = 'TICKET_CREATED' } = options;

  let pubsub: PubSub;

  try {
    // If a service account key is provided in config, decrypt it and use it.
    // Otherwise, default to application default credentials.
    if (serviceAccountKeyEncrypted) {
      const decryptedKeyString = decryptToken(serviceAccountKeyEncrypted);
      const credentials = JSON.parse(decryptedKeyString);
      pubsub = new PubSub({
        projectId: credentials.project_id,
        credentials,
      });
    } else {
      pubsub = new PubSub();
    }

    const dataBuffer = Buffer.from(JSON.stringify(payload));
    
    // Attributes to help subscribers filter messages
    const attributes = {
      ticketId: issueId,
      eventType: eventType,
      timestamp: new Date().toISOString(),
    };

    // Publish the message
    await pubsub.topic(topicName).publishMessage({
      data: dataBuffer,
      attributes,
    });

  } catch (error: any) {
    if (attempt <= MAX_RETRIES) {
      // Exponential backoff
      const backoffDelay = INITIAL_BACKOFF_MS * Math.pow(2, attempt - 1);
      console.warn(`[Pub/Sub] Publish failed for issue ${issueId}, retrying in ${backoffDelay}ms (Attempt ${attempt}/${MAX_RETRIES}). Error: ${error.message}`);
      
      await sleep(backoffDelay);
      
      // Recursive retry
      return publishToPubSub(options, attempt + 1);
    } else {
      console.error(`[Pub/Sub] Final publish failure for issue ${issueId} after ${MAX_RETRIES} attempts. Logging to DB.`);
      
      try {
        await connectToDatabase();
        await PubSubFailure.create({
          issueId,
          topicName,
          payload,
          error: error.message,
        });
      } catch (dbError) {
        console.error('[Pub/Sub] Failed to write dead-letter log to MongoDB:', dbError);
      }
    }
  }
}
