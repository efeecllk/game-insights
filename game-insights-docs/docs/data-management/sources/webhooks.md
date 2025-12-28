---
sidebar_position: 5
title: Webhook Streaming
description: Stream real-time data to Game Insights using webhooks
---

# Webhook Streaming

Receive real-time data from external services via webhooks. Perfect for capturing events from game servers, analytics platforms, or custom pipelines.

## Overview

| Feature | Details |
|---------|---------|
| **Protocol** | HTTPS POST |
| **Format** | JSON |
| **Authentication** | API Key, HMAC, JWT |
| **Best For** | Server events, third-party integrations |

## Setup

### Create Webhook Endpoint

```typescript
import { WebhookAdapter } from '@/adapters/WebhookAdapter';

const adapter = new WebhookAdapter();

const endpoint = await adapter.createEndpoint({
  name: 'Game Server Events',
  authentication: 'hmac',
  secretKey: 'your-secret-key'
});

console.log('Webhook URL:', endpoint.url);
// https://api.gameinsights.io/webhooks/wh_abc123
```

### Payload Format

Standard event format:

```json
{
  "event_type": "purchase",
  "timestamp": "2024-01-15T10:30:00Z",
  "user_id": "user_123",
  "properties": {
    "item_id": "sword_001",
    "amount": 9.99,
    "currency": "USD"
  }
}
```

Batch events:

```json
{
  "events": [
    { "event_type": "level_complete", "user_id": "user_123", ... },
    { "event_type": "level_start", "user_id": "user_123", ... }
  ]
}
```

## Authentication

### API Key

```typescript
const endpoint = await adapter.createEndpoint({
  name: 'Game Server Events',
  authentication: 'api_key',
  apiKey: 'your-api-key'
});

// Sender includes: X-API-Key: your-api-key
```

### HMAC Signature

```typescript
const endpoint = await adapter.createEndpoint({
  name: 'Game Server Events',
  authentication: 'hmac',
  secretKey: 'your-secret-key',
  hmacAlgorithm: 'sha256'
});
```

Sending signed requests:

```javascript
const crypto = require('crypto');

const payload = JSON.stringify(event);
const timestamp = Date.now().toString();
const signature = crypto
  .createHmac('sha256', 'your-secret-key')
  .update(`${timestamp}.${payload}`)
  .digest('hex');

fetch(webhookUrl, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Webhook-Timestamp': timestamp,
    'X-Webhook-Signature': `sha256=${signature}`
  },
  body: payload
});
```

## Listening for Events

```typescript
await adapter.connect({ endpointId: 'wh_abc123' });

adapter.on('event', (event) => {
  console.log('Received:', event.event_type);
  processEvent(event);
});

adapter.on('batch', (events) => {
  console.log(`Received ${events.length} events`);
  processBatch(events);
});

await adapter.startListening();
```

## Error Handling

### Retry Configuration

```typescript
await adapter.connect({
  endpointId: 'wh_abc123',
  retry: {
    enabled: true,
    maxRetries: 3,
    initialDelay: 1000,
    backoffMultiplier: 2
  }
});

adapter.on('dead_letter', (event, error) => {
  saveToDeadLetterQueue(event);
});
```

### Response Codes

| Code | Meaning |
|------|---------|
| `200` | Success |
| `400` | Invalid payload |
| `401` | Unauthorized |
| `429` | Rate limited |
| `500` | Server error (retry) |

## Testing

```bash
curl -X POST https://api.gameinsights.io/webhooks/wh_abc123 \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{"event_type": "test", "user_id": "test_user"}'
```

## Related

- [Custom API](/docs/data-management/sources/api)
- [Real-Time Analytics](/docs/features/real-time)
- [Alert System](/docs/features/alerts)
