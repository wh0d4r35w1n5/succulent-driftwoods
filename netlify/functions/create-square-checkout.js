// Netlify Function — creates a per-customer Square payment link on the fly.
// Required env vars (set in Netlify dashboard → Site settings → Environment variables):
//   SQUARE_ACCESS_TOKEN  — your Square production access token
//   SQUARE_LOCATION_ID   — your Square location ID (defaults to the known value below)

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const SQUARE_ACCESS_TOKEN = process.env.SQUARE_ACCESS_TOKEN;
  const SQUARE_LOCATION_ID  = process.env.SQUARE_LOCATION_ID || 'LFYR6JJQP1R4V';

  if (!SQUARE_ACCESS_TOKEN) {
    console.error('SQUARE_ACCESS_TOKEN env var is not set');
    return { statusCode: 500, body: JSON.stringify({ error: 'Payment service not configured' }) };
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON body' }) };
  }

  const { guestCount, name, email, phone, dateLabel } = body;

  if (!guestCount || !name || !email) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing required fields: guestCount, name, email' }) };
  }

  const guests = Math.min(Math.max(parseInt(guestCount) || 1, 1), 10);

  // Split full name into first / last
  const nameParts = name.trim().split(/\s+/);
  const firstName = nameParts[0] || '';
  const lastName  = nameParts.slice(1).join(' ') || undefined;

  const linkName = [
    `Succulent Driftwood Workshop`,
    dateLabel ? `· ${dateLabel}` : '',
    `— ${guests} guest${guests > 1 ? 's' : ''} ($${guests * 100} AUD)`
  ].filter(Boolean).join(' ');

  const prePopulatedData = {
    buyer_email: email,
    buyer_address: {
      first_name: firstName,
      ...(lastName ? { last_name: lastName } : {})
    },
    ...(phone ? { buyer_phone_number: phone } : {})
  };

  const payload = {
    idempotency_key: `booking-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    quick_pay: {
      name: linkName,
      price_money: { amount: guests * 10000, currency: 'AUD' },
      location_id: SQUARE_LOCATION_ID
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
    pre_populated_data: prePopulatedData
  };

  try {
    const res = await fetch('https://connect.squareup.com/v2/online-checkout/payment-links', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SQUARE_ACCESS_TOKEN}`,
        'Square-Version': '2024-06-04',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (data.errors) {
      console.error('Square API error:', JSON.stringify(data.errors));
      return { statusCode: 502, body: JSON.stringify({ error: data.errors[0]?.detail || 'Square API error' }) };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ url: data.payment_link.long_url })
    };

  } catch (err) {
    console.error('Fetch error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
