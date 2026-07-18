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

async function handleSendEmails(body, env, CORS) {
  const RESEND_KEY = env.RESEND_API_KEY;
  if (!RESEND_KEY) {
    return new Response(JSON.stringify({ error: 'RESEND_API_KEY not set' }), {
      status: 500, headers: { ...CORS, 'Content-Type': 'application/json' }
    });
  }

  const { name, email, phone, dateLabel, guestCount, names } = body;
  if (!name || !email) {
    return new Response(JSON.stringify({ error: 'Missing name or email' }), {
      status: 400, headers: { ...CORS, 'Content-Type': 'application/json' }
    });
  }

  const guestNames  = Array.isArray(names) && names.filter(Boolean).length > 0
    ? names.filter(Boolean) : [name];
  const guestCount_ = parseInt(guestCount) || guestNames.length;
  const total       = guestCount_ * 100;
  const FROM        = 'Succulent Driftwoods <bookings@succulentdriftwoods.com.au>';

  // ── Linda notification ────────────────────────────────────────────────────
  const lindaText = [
    'NEW BOOKING — payment received via Square.',
    '─────────────────────────────────────',
    'DATE: '         + (dateLabel || 'not specified'),
    'GUESTS: '       + guestCount_ + ' x $100 = 
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

    // ── Email sending action ──────────────────────────────────────────────────
    if (body.action === 'send_emails') {
      return handleSendEmails(body, env, CORS);
    }

    // ── Square payment link creation (default) ────────────────────────────────
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

    // Build guest list for Square line item name + payment note
    // Uses the names[] array from the form if provided, falls back to booker name
    const guestNames = Array.isArray(body.names) && body.names.filter(Boolean).length > 0
      ? body.names.filter(Boolean)
      : [name];
    const guestListStr = guestNames.join(', ');

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

    // Item name shown in Linda's Square dashboard against every payment
    const linkName = `Succulent Driftwood Workshop — ${guestListStr} (${guests * 100} AUD)${dateLabel ? ' · ' + dateLabel : ''}`;

    // One line item per guest — each appears individually in Square's Order Summary,
    // on the customer's receipt, and in Linda's Square dashboard.
    const lineItems = guestNames.map(guestName => ({
      name: `${guestName} — Succulent Driftwood Workshop${dateLabel ? ' · ' + dateLabel : ''}`,
      quantity: '1',
      base_price_money: { amount: 10000, currency: 'AUD' }
    }));

    const payload = {
      idempotency_key: `booking-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
      order: {
        location_id: LOCATION,
        line_items: lineItems
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
 + total,
    'GUEST NAMES:',
    guestNames.map((n, i) => '  ' + (i + 1) + '. ' + n).join('\n'),
    '',
    'BOOKER NAME:   ' + name,
    'BOOKER EMAIL:  ' + email,
    'BOOKER MOBILE: ' + (phone || 'not provided'),
  ].join('\n');

  // ── Customer receipt ──────────────────────────────────────────────────────
  const customerText = [
    'Hi ' + name + ',',
    '',
    "Your spot is confirmed — payment received. We're so excited to welcome you!",
    '',
    '─────────────────────────────────────',
    'WORKSHOP DETAILS',
    '─────────────────────────────────────',
    'Date:      ' + (dateLabel || 'TBC'),
    'Time:      10:00 AM – 12:00 PM',
    'Location:  19 Yengara Way, Ocean Shores NSW 2483',
    'Guests:    ' + guestCount_ + ' (' + guestNames.join(', ') + ')',
    'Price:     $100 AUD per person',
    'Total:     
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

    // ── Email sending action ──────────────────────────────────────────────────
    if (body.action === 'send_emails') {
      return handleSendEmails(body, env, CORS);
    }

    // ── Square payment link creation (default) ────────────────────────────────
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

    // Build guest list for Square line item name + payment note
    // Uses the names[] array from the form if provided, falls back to booker name
    const guestNames = Array.isArray(body.names) && body.names.filter(Boolean).length > 0
      ? body.names.filter(Boolean)
      : [name];
    const guestListStr = guestNames.join(', ');

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

    // Item name shown in Linda's Square dashboard against every payment
    const linkName = `Succulent Driftwood Workshop — ${guestListStr} (${guests * 100} AUD)${dateLabel ? ' · ' + dateLabel : ''}`;

    // One line item per guest — each appears individually in Square's Order Summary,
    // on the customer's receipt, and in Linda's Square dashboard.
    const lineItems = guestNames.map(guestName => ({
      name: `${guestName} — Succulent Driftwood Workshop${dateLabel ? ' · ' + dateLabel : ''}`,
      quantity: '1',
      base_price_money: { amount: 10000, currency: 'AUD' }
    }));

    const payload = {
      idempotency_key: `booking-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
      order: {
        location_id: LOCATION,
        line_items: lineItems
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
 + total + ' AUD — paid via Square',
    '─────────────────────────────────────',
    '',
    'Everything is included — all materials and morning tea.',
    '',
    'Any questions? Call or text Linda on 0422 879 921.',
    '',
    'See you soon!',
    'Linda',
    'Succulent Driftwoods',
    'succulentdriftwoods.com.au',
  ].join('\n');

  const lindaAddresses = [
    'linda@succulentdriftwoods.com.au',
    'lindaolsen4healing@outlook.com',
    'lindalionheart72@gmail.com',
    'lindaolsen4healing@gmail.com',
    'lindalionheart44@gmail.com',
  ];

  async function resendSend(payload) {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + RESEND_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) console.error('Resend error:', JSON.stringify(data));
    return res.ok;
  }

  // Send both in parallel
  const [lindaOk, customerOk] = await Promise.all([
    resendSend({
      from: FROM,
      to:   lindaAddresses,
      subject: '✅ New Booking PAID — ' + (dateLabel || ''),
      text: lindaText,
    }),
    resendSend({
      from: FROM,
      to:   [email],
      subject: "✓ You're booked! Succulent Driftwood Workshop — " + (dateLabel || ''),
      text: customerText,
    }),
  ]);

  return new Response(JSON.stringify({ ok: true, linda: lindaOk, customer: customerOk }), {
    headers: { ...CORS, 'Content-Type': 'application/json' }
  });
}

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

    // ── Email sending action ──────────────────────────────────────────────────
    if (body.action === 'send_emails') {
      return handleSendEmails(body, env, CORS);
    }

    // ── Square payment link creation (default) ────────────────────────────────
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

    // Build guest list for Square line item name + payment note
    // Uses the names[] array from the form if provided, falls back to booker name
    const guestNames = Array.isArray(body.names) && body.names.filter(Boolean).length > 0
      ? body.names.filter(Boolean)
      : [name];
    const guestListStr = guestNames.join(', ');

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

    // Item name shown in Linda's Square dashboard against every payment
    const linkName = `Succulent Driftwood Workshop — ${guestListStr} (${guests * 100} AUD)${dateLabel ? ' · ' + dateLabel : ''}`;

    // One line item per guest — each appears individually in Square's Order Summary,
    // on the customer's receipt, and in Linda's Square dashboard.
    const lineItems = guestNames.map(guestName => ({
      name: `${guestName} — Succulent Driftwood Workshop${dateLabel ? ' · ' + dateLabel : ''}`,
      quantity: '1',
      base_price_money: { amount: 10000, currency: 'AUD' }
    }));

    const payload = {
      idempotency_key: `booking-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
      order: {
        location_id: LOCATION,
        line_items: lineItems
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
