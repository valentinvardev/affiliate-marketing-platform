# TapRain API Reference

## Credentials

| Key | Value |
|---|---|
| API Key | `21f1b1200d6ebc03ac422018d31d2881` |
| User ID (external_identifier) | `6a2790dacb5114fa91525b9e` |
| Auth header | `X-Api-Key: <api_key>` |
| Alt header | `Authorization: Bearer <api_key>` |

---

## 1. Inbound Postback (S2S)

TapRain fires this URL on your behalf when a conversion occurs. Configure it in your traffic source.

```
GET https://taprain.com/api/postback/cpa
```

**Your pre-filled inbound URL:**
```
https://taprain.com/api/postback/cpa?key=21f1b1200d6ebc03ac422018d31d2881&external_identifier=6a2790dacb5114fa91525b9e&amount={price}&offer_name={offer_name}&status=1
```

### Required parameters

| Param | Type | Description |
|---|---|---|
| `key` | string | Your API key (never expose client-side) |
| `external_identifier` | string | TapRain publisher ID to credit (your user ID) |
| `amount` | integer | Payout in **cents** — e.g. `250` = $2.50 |

### Optional parameters

| Param | Type | Description |
|---|---|---|
| `offer_name` | string | Display name of completed offer |
| `offer_id` | string | Your internal offer ID |
| `status` | integer | `1` = approved |
| `country_code` | string | ISO 3166-1 alpha-2 (US, DE, GB…) |
| `ip` | string | End-user IP for fraud scoring |
| `unix` | integer | Unix timestamp of conversion (defaults to receive time) |
| `lead_id` | string | Network's internal lead/transaction ID |
| `click_id` | string | Click-level tracking ID from traffic source |
| `s2` | string | Secondary sub-ID (template ID, placement ID…) |

### Response codes

| Code | Meaning |
|---|---|
| 200 | Received & processed. Body: `{"message":"ok"}` — does NOT guarantee credit (quality checks run silently) |
| 400 | Missing required params or invalid amount |
| 401 | Invalid or missing key |
| 403 | IP not whitelisted — contact support |
| 404 | `external_identifier` not found |
| 500 | Server error — retry with exponential backoff |

> Requests must come from a **pre-approved server IP**. HTTP is rejected; HTTPS only.

---

## 2. Outbound Global Postback

TapRain fires this single URL for **every** conversion across all offers and offerwalls.

Set your URL in the TapRain dashboard. Available macros:

| Macro | Description |
|---|---|
| `{price}` | Payout amount |
| `{s1}` – `{s5}` | Sub-IDs 1–5 |
| `{click_id}` | Click ID |
| `{conversion_id}` | TapRain conversion ID |
| `{offer_name}` | Offer name |
| `{country}` | Country code |
| `{ip}` | User IP |

**Example URL:**
```
https://your-tracker.com/postback?payout={price}&offer={offer_name}&s1={s1}
```

---

## 3. Stats API

```
GET https://taprain.com/api/v1/stats
```

Auth: `X-Api-Key` header.

### Query parameters

| Param | Values | Description |
|---|---|---|
| `range` | `hour`, `today`, `yesterday`, `7days`, `30days`, `custom` | Time range |
| `start` | `YYYY-MM-DD` | Required if `range=custom` |
| `end` | `YYYY-MM-DD` | Required if `range=custom` |
| `timezone` | IANA string | Default: `America/New_York` |
| `country` | Comma-separated ISO codes | Filter by country |
| `offer` | Comma-separated offer names | Filter by offer |

### Example

```js
const res = await fetch('https://taprain.com/api/v1/stats?range=today', {
  headers: { 'X-Api-Key': '21f1b1200d6ebc03ac422018d31d2881' }
});
const { data } = await res.json();
console.log(data.summary.revenue);
```

---

## 4. Offers API

```
Base URL: https://taprain.com/api/offers/developer
```

Auth: `X-Api-Key` header. Rate limit: **60 req/min**. Max **200** per page.

### Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/offers` | All offers your account can access |
| GET | `/api-key` | Returns your current API key (session auth required) |
| POST | `/rotate-api-key` | Generates new key, **permanently invalidates old one** (session auth required) |

### GET /offers — Query parameters

| Param | Description |
|---|---|
| `countries` | Comma-separated ISO codes (e.g. `US,GB,CA`) |
| `devices` | `android`, `ios`, `desktop` (comma-separated) |
| `search` | Case-insensitive partial match on name/description |
| `type` | `cpi`, `cpe`, `soi`, `rev-share`, `all` |
| `limit` | 1–200 (default: 50) |
| `offset` | Pagination offset |
| `domain` | Tracking domain: `taprkr.com` or `raintrkr.com` |
| `include_api_offers` | `true` to fetch live network offers (adds 2–4s latency) |

### Response schema

```json
{
  "success": true,
  "total": 14,
  "offset": 0,
  "limit": 50,
  "has_more": false,
  "offers": [
    {
      "id": "freecash-cpi",
      "name": "FreeCash CPI",
      "description": "Sign up and complete the install",
      "payout": 8.50,
      "currency": "USD",
      "payout_type": "CPA",
      "image_url": "https://taprain.com/previews/freecash.png",
      "tracking_url": "https://taprkr.com/r/eyJ0...",
      "countries": ["US", "GB", "CA"],
      "devices": ["android", "ios"],
      "daily_cap": null,
      "is_private": true,
      "source": "database"
    }
  ]
}
```

### Offer object fields

| Field | Type | Description |
|---|---|---|
| `id` | string | Unique offer identifier |
| `name` | string | Human-readable display name |
| `description` | string | Brief offer description |
| `conversion` | string | Specific action required for conversion |
| `payout` | number \| null | Your payout per conversion in USD (null for RevShare) |
| `payout_type` | string | `CPA` (flat) or `RevShare` (85/15 split) |
| `image_url` | string \| null | Absolute URL of offer icon |
| `tracking_url` | string | Ready-to-use link — **user ID already encoded, do not modify** |
| `countries` | string[] | ISO alpha-2 codes |
| `devices` | string[] | `android`, `ios`, `desktop` |
| `daily_cap` | number \| null | Max conversions/day — null = no cap |
| `is_private` | boolean | Required approval to access |
| `source` | string | `database` (curated) or `network` (live) |

### Error codes

| Code | Meaning |
|---|---|
| 401 | Missing or invalid API key |
| 429 | Rate limit exceeded (60 req/min) |
| 500 | Internal error — retry, contact support if persistent |

### Code examples

```js
const API_KEY  = '21f1b1200d6ebc03ac422018d31d2881';
const BASE_URL = 'https://taprain.com/api/offers/developer';

async function getOffers(filters = {}) {
  const params = new URLSearchParams(
    Object.fromEntries(Object.entries(filters).filter(([, v]) => v))
  );
  const res = await fetch(`${BASE_URL}/offers?${params}`, {
    headers: { 'X-Api-Key': API_KEY }
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

// All offers
const { total, offers } = await getOffers();

// US Android CPI only
const cpi = await getOffers({ countries: 'US', devices: 'android', type: 'cpi' });

// Paginate through everything
async function getAllOffers(filters = {}) {
  const all = [];
  let offset = 0;
  while (true) {
    const page = await getOffers({ ...filters, limit: 200, offset });
    all.push(...page.offers);
    if (!page.has_more) break;
    offset += 200;
  }
  return all;
}
```

---

## 5. Offerwall Embed

Offerwalls are served from `rainawards.com`. Each has a unique ID shown on the Offerwalls page in the dashboard.

### Script embed (recommended)
```html
<script
  src="https://rainawards.com/locker-embed.js"
  data-offerwall-id="YOUR_OFFERWALL_ID"
></script>
```

### iframe embed
```html
<iframe
  src="https://rainawards.com/ow/YOUR_OFFERWALL_ID"
  width="100%"
  height="600"
  frameborder="0"
  style="border-radius: 16px; border: none;"
></iframe>
```

### Options
- Append `?format=json` to `/ow/<id>` to get offers as JSON instead of HTML
- Pass `?s1=<value>` to attribute traffic to a sub-ID

```html
<iframe
  src="https://rainawards.com/ow/YOUR_OFFERWALL_ID?s1=mysite"
  ...
></iframe>
```

---

## Quick reference

```
Postback:   GET  https://taprain.com/api/postback/cpa
Stats:      GET  https://taprain.com/api/v1/stats
Offers:     GET  https://taprain.com/api/offers/developer/offers
Offerwall:  https://rainawards.com/ow/<id>

Auth:       X-Api-Key: 21f1b1200d6ebc03ac422018d31d2881
User ID:    6a2790dacb5114fa91525b9e
```
