# Succulent Driftwood Garden Workshops Website

This repository contains the updated code for the Succulent Driftwood Garden Workshops website, now integrated with Stripe for secure online payments via Netlify Functions.

## Deployment Instructions

Follow these steps to deploy the updated website to Netlify and enable Stripe payments:

### 1. Clone the Repository

First, clone this repository to your local machine:

```bash
git clone https://github.com/wh0d4r35w1n5/succulent-driftwoods.git
cd succulent-driftwoods
```

### 2. Install Dependencies

Install the necessary Node.js dependencies for the Netlify Function:

```bash
npm install
```

### 3. Set up Netlify

If you haven't already, install the Netlify CLI:

```bash
npm install netlify-cli -g
```

Then, link your project to Netlify:

```bash
netlify link
```

Follow the prompts to connect to your existing Netlify site or create a new one.

### 4. Configure Environment Variables

Your Stripe Secret Key needs to be securely stored as an environment variable in Netlify. This ensures your key is not exposed in your frontend code.

1.  Go to your Netlify site dashboard.
2.  Navigate to **Site settings > Build & deploy > Environment variables**.
3.  Add a new variable:
    *   **Key:** `STRIPE_SECRET_KEY`
    *   **Value:** `[Your Stripe Secret Key]`

### 5. Deploy to Netlify

Deploy the updated site and functions to Netlify:

```bash
netlify deploy --prod
```

This command will build and deploy your site, including the new Netlify Function, to your production URL.

## Stripe Integration Details

-   **Frontend (`index.html`):** The "Book & Pay Now with Stripe" button now triggers a JavaScript function that calls your Netlify Function.
-   **Backend (`netlify/functions/create-checkout.js`):** This serverless function securely communicates with the Stripe API to create a Checkout Session. It expects a `quantity` parameter in the request body.
-   **Success Page (`thank-you.html`):** This page has been updated to reflect a successful Stripe payment and provides instructions for the user.

## Testing

After deployment, navigate to your website and test the "Book & Pay Now with Stripe" button. It should redirect you to a Stripe-hosted checkout page. Complete a test payment (using Stripe's test card numbers if in test mode) and verify that you are redirected to the `thank-you.html` page with the updated success message.

## Important Notes

-   **Stripe Webhooks:** For robust order fulfillment and to handle various payment outcomes (e.g., failed payments, refunds), it is highly recommended to set up [Stripe Webhooks](https://stripe.com/docs/webhooks). This would involve creating another Netlify Function to listen for Stripe events.
-   **Workshop Date Selection:** Currently, the workshop date selection is handled by Linda directly after booking. For a more automated system, you might consider integrating a booking calendar solution.

If you have any questions or need further assistance, please let me know!
