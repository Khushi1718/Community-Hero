import { IIntegrationConfig } from "@/models/IntegrationConfig";

export function buildCRMPayload(ticket: any, config?: IIntegrationConfig) {
  // Base payload schema defined in requirements
  const payload: Record<string, any> = {
    ticket_id: ticket.issueId || ticket._id.toString(),
    reported_at: ticket.createdAt,
    issue: {
      category: ticket.aiAnalysis?.category || ticket.title,
      subcategory: ticket.aiAnalysis?.subcategory,
      ai_confidence: ticket.aiAnalysis?.confidenceScore,
      severity: ticket.aiAnalysis?.severity,
      severity_reasoning: ticket.aiAnalysis?.severityReason,
    },
    location: {
      lat: ticket.location?.coordinates?.[1],
      lng: ticket.location?.coordinates?.[0],
      address: ticket.location?.address,
      zone_id: ticket.adoptedAreaId || ticket.location?.city,
    },
    department_assigned: ticket.assignedDepartment,
    media: ticket.imageUrl ? [{ type: 'image', url: ticket.imageUrl }] : [],
    reporter: {
      anonymous: !ticket.citizenEmail,
      citizen_id: ticket.citizenEmail,
    },
    status: ticket.status,
    callback_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/webhooks/crm-status-update`
  };

  // Apply field mappings if they exist
  if (config?.fieldMapping) {
    const mappings = config.fieldMapping instanceof Map 
        ? Object.fromEntries(config.fieldMapping)
        : config.fieldMapping;
        
    for (const [internalKey, externalKey] of Object.entries(mappings)) {
      // Very basic flat mapping - for a production system, this could use lodash.get/set
      if (internalKey && externalKey && payload[internalKey] !== undefined) {
        payload[externalKey as string] = payload[internalKey];
        delete payload[internalKey]; // Remove the old key if remapped at top level
      }
    }
  }

  return payload;
}
