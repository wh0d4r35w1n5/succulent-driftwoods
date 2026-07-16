const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { quantity = 1 } = JSON.parse(event.body);

    // Validate quantity
    if (!quantity || quantity < 1 || quantity > 10) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid quantity. Must be between 1 and 10.' }),
      };
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'aud',
            product_data: {
              name: 'Succulent Driftwood Garden Workshop',
              description: 'Saturday 10:00 AM – 12:00 PM at 19 Yengara Way, Ocean Shores',
              images: ['https://succulentdriftwoods.com.au/photo_57_2026-07-07_19-43-48.png'],
            },
            unit_amount: 10000, // $100 AUD in cents
          },
          quantity: quantity,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.URL}/thank-you.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.URL}/#book`,
      customer_email_collection: 'required',
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ sessionId: session.id, url: session.url }),
    };
  } catch (error) {
    console.error('Stripe error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
