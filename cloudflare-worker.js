// Cloudflare Worker — creates personalised Square payment links and sends booking emails via Resend.
// Secrets required (set via Cloudflare dashboard or wrangler secret put):
//   SQUARE_ACCESS_TOKEN  — your Square API token (starts with EAAA…)
//   RESEND_API_KEY       — your Resend API key (starts with re_…)

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
  const dollar      = '$';

  const lindaText = [
    'NEW BOOKING — payment received via Square.',
    '─────────────────────────────────────',
    'DATE: '         + (dateLabel || 'not specified'),
    'GUESTS: '       + guestCount_ + ' x ' + dollar + '100 = ' + dollar + total,
    'GUEST NAMES:',
    guestNames.map((n, i) => '  ' + (i + 1) + '. ' + n).join('\n'),
    '',
    'BOOKER NAME:   ' + name,
    'BOOKER EMAIL:  ' + email,
    'BOOKER MOBILE: ' + (phone || 'not provided'),
  ].join('\n');

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
    'Price:     ' + dollar + '100 AUD per person',
    'Total:     ' + dollar + total + ' AUD — paid via Square',
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

  const [lindaOk, customerOk] = await Promise.all([
    resendSend({
      from:    FROM,
      to:      lindaAddresses,
      subject: '✅ New Booking PAID — ' + (dateLabel || ''),
      text:    lindaText,
    }),
    resendSend({
      from:    FROM,
      to:      [email],
      subject: "✓ You're booked! Succulent Driftwood Workshop — " + (dateLabel || ''),
      text:    customerText,
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
    if (!TOKEN) {
      return new Response(JSON.stringify({ error: 'SQUARE_ACCESS_TOKEN secret not set' }), {
        status: 500,
        headers: { ...CORS, 'Content-Type': 'application/json' }
      });
    }

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

    const guestNames = Array.isArray(body.names) && body.names.filter(Boolean).length > 0
      ? body.names.filter(Boolean)
      : [name];

    function formatPhone(raw) {
      if (!raw) return undefined;
      const digits = raw.replace(/[^\d]/g, '');
      if (!digits) return undefined;
      if (raw.trim().startsWith('+')) {
        const e164 = '+' + digits;
        return e164.length >= 8 ? e164 : undefined;
      }
      if (digits.startsWith('0') && digits.length === 10) return '+61' + digits.slice(1);
      if (digits.length === 9 && digits.startsWith('4'))  return '+61' + digits;
      if (digits.length === 11 && digits.startsWith('61')) return '+' + digits;
      return undefined;
    }

    const formattedPhone = formatPhone(phone);

    const lineItems = guestNames.map(guestName => ({
      name: guestName + ' — Succulent Driftwood Workshop' + (dateLabel ? ' · ' + dateLabel : ''),
      quantity: '1',
      base_price_money: { amount: 10000, currency: 'AUD' }
    }));

    const payload = {
      idempotency_key: 'booking-' + Date.now() + '-' + Math.random().toString(36).slice(2, 10),
      order: {
        location_id: LOCATION,
        line_items:  lineItems
      },
      checkout_options: {
        redirect_url:            'https://succulentdriftwoods.com.au/?booked=1',
        ask_for_shipping_address: false,
        enable_coupon:            false,
        enable_loyalty:           false,
        accepted_payment_methods: {
          apple_pay:        true,
          google_pay:       true,
          cash_app_pay:     false,
          afterpay_clearpay: true
        }
      },
      pre_populated_data: {
        buyer_email:   email,
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
        'Authorization':  'Bearer ' + TOKEN,
        'Square-Version': '2024-06-04',
        'Content-Type':   'application/json'
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
