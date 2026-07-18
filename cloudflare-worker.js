// Cloudflare Worker — creates a personalised Square payment link per booking.
// Free forever on Cloudflare's free plan (100,000 requests/day, no expiry).
//
// DEPLOY INSTRUCTIONS (one-time setup):
//   1. Create a free account at https://cloudflare.com
//   2. Install wrangler: npm install -g wrangler
//   3. Login: npx wrangler login
//   4. Deploy: npx wrangler deploy (run from the repo root)
//   5. Set your Square token: npx wrangler secret put SQUARE_ACCESS_TOKEN
//      (paste your token starting with EAAA… when prompted — never stored in code)
//   6. Copy the worker URL shown after deploy (e.g. https://succulent-checkout.YOUR.workers.dev)
//      and paste it into index.html where it says REPLACE_WITH_YOUR_WORKER_URL

export default {
  async fetch(request, env) {

    const CORS = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS });
    }

    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...CORS, 'Content-Type': 'application/json' }
      });
    }

    const TOKEN    = env.SQUARE_ACCESS_TOKEN;
    const LOCATION = env.SQUARE_LOCATION_ID || 'LFYR6JJQP1R4V';

    if (!TOKEN) {
      return new Response(JSON.stringify({ error: 'SQUARE_ACCESS_TOKEN secret not set' }), {
        status: 500,
        headers: { ...CORS, 'Content-Type': 'application/json' }
      });
    }

    let body;
    try { body = await request.json(); }
    catch { return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { ...CORS, 'Content-Type': 'application/json' }
    }); }

    const { guestCount, name, email, phone, dateLabel } = body;

    if (!guestCount || !name || !email) {
      return new Response(JSON.stringify({ error: 'Missing: guestCount, name, email' }), {
        status: 400,
        headers: { ...CORS, 'Content-Type': 'application/json' }
      });
    }

    const guests    = Math.min(Math.max(parseInt(guestCount) || 1, 1), 10);
    const nameParts = name.trim().split(/\s+/);
    const firstName = nameParts[0] || '';
    const lastName  = nameParts.slice(1).join(' ') || undefined;

    // Format Australian phone numbers to E.164 (+61xxxxxxxxx)
    // Square requires E.164 format — local AU numbers start with 04 or 03/02/07/08
    function formatPhone(raw) {
      if (!raw) return undefined;
      // Strip everything except digits and leading +
      const digits = raw.replace(/[^\d]/g, '');
      if (!digits) return undefined;
      // Already has country code (10+ digits starting with 61)
      if (raw.trim().startsWith('+')) {
        const e164 = '+' + digits;
        return e164.length >= 8 ? e164 : undefined;
      }
      // Australian numbers: 10 digits starting with 0 (e.g. 0400123456)
      if (digits.startsWith('0') && digits.length === 10) {
        return '+61' + digits.slice(1);
      }
      // Already missing leading 0 (9 digits, AU mobile)
      if (digits.length === 9 && digits.startsWith('4')) {
        return '+61' + digits;
      }
      // International without + (e.g. 61400123456)
      if (digits.length === 11 && digits.startsWith('61')) {
        return '+' + digits;
      }
      // Can't determine format — skip to avoid Square API error
      return undefined;
    }

    const formattedPhone = formatPhone(phone);

    const linkName = `Succulent Driftwood Workshop — ${guests} guest${guests > 1 ? 's' : ''} ($${guests * 100} AUD)${dateLabel ? ' · ' + dateLabel : ''}`;

    const payload = {
      idempotency_key: `booking-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
      quick_pay: {
        name: linkName,
        price_money: { amount: guests * 10000, currency: 'AUD' },
        location_id: LOCATION
      },
      checkout_options: {
        redirect_url: 'https://succulentdriftwoods.com.au/?booked=1',
        ask_for_shipping_address: false,
        enable_coupon: false,
        enable_loyalty: false,
        accepted_payment_methods: {
          apple_pay: true,
          google_pay: true,
          cash_app_pay: false,
          afterpay_clearpay: true
        }
      },
      pre_populated_data: {
        buyer_email: email,
        buyer_address: {
          first_name: firstName,
          ...(lastName ? { last_name: lastName } : {})
        },
        ...(formattedPhone ? { buyer_phone_number: formattedPhone } : {})
      }
    };

    const squareRes = await fetch('https://connect.squareup.com/v2/online-checkout/payment-links', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Square-Version': '2024-06-04',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await squareRes.json();

    if (data.errors) {
      console.error('Square error:', JSON.stringify(data.errors));
      return new Response(JSON.stringify({ error: data.errors[0]?.detail || 'Square API error' }), {
        status: 502,
        headers: { ...CORS, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ url: data.payment_link.long_url }), {
      headers: { ...CORS, 'Content-Type': 'application/json' }
    });
  }
};
