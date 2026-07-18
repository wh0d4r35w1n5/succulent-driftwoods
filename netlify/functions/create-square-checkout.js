const { Client, Environment } = require('square');

// Initialize Square client
const client = new Client({
  accessToken: process.env.SQUARE_ACCESS_TOKEN,
  environment: Environment.Production, // Use Production for real payments
});

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const { quantity, sessionDate, guestNames, bookerName, bookerEmail, bookerPhone } = JSON.parse(event.body);

    // Validate input
    if (!quantity || !sessionDate || !guestNames || !bookerName || !bookerEmail) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing required fields' }) };
    }

    const totalAmount = quantity * 10000; // $100 per person in cents

    // Create a payment link
    const response = await client.checkoutApi.createPaymentLink({
      idempotencyKey: require('crypto').randomBytes(12).toString('hex'),
      quickPay: {
        name: `Succulent Driftwood Workshop - ${sessionDate}`,
        priceMoney: {
          amount: totalAmount,
          currency: 'AUD'
        },
        locationId: process.env.SQUARE_LOCATION_ID
      },
      checkoutOptions: {
        redirectUrl: `${process.env.URL}/?booked=1`,
        askForShippingAddress: false,
      },
      prePopulatedData: {
        buyerEmail: bookerEmail,
        buyerPhoneNumber: bookerPhone
      },
      metadata: {
        sessionDate: sessionDate,
        guestNames: guestNames.join(', '),
        bookerName: bookerName,
        quantity: quantity.toString()
      }
    });

    const result = response.result;

    return {
      statusCode: 200,
      body: JSON.stringify({ checkoutUrl: result.paymentLink.url }),
    };
  } catch (error) {
    console.error('Square error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
