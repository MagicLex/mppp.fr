# Mon P'tit Poulet

A modern web application for a Portuguese chicken restaurant, built with React, TypeScript, and Tailwind CSS.

## Features

- Interactive menu with product listings
- Shopping cart functionality
- Checkout process with Stripe integration
- HubSpot CRM integration for customer management
- Responsive design with cartoon-style UI

## Getting Started

### Prerequisites

- Node.js 16.x or higher
- npm 7.x or higher

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/MagicLex/mppp.fr.git
   cd mppp.fr
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Start the development server
   ```bash
   npm run dev
   ```

4. Build for production
   ```bash
   npm run build
   ```

## Deployment

### Vercel Deployment (Recommended)

The application is configured for deployment to Vercel with serverless functions:

1. Connect your GitHub repository to Vercel
2. Vercel will automatically detect the build settings from `vercel.json`
3. Set up the environment variables in your Vercel project settings
4. Deploy your application

### Alternative Deployment

For other platforms:

1. Build the application
   ```bash
   npm run build
   ```

2. Deploy the contents of the `dist` directory

## Adding Images

Images are stored in the `public/images` directory:

- `/public/images/logos/` - Brand logos and icons
- `/public/images/menu/` - Food product images
- `/public/images/ui/` - UI elements and decorative images

You can add or replace images even after building the application.

## Environment Variables

For the Vercel deployment with serverless functions, set these environment variables:

```
# Stripe API keys
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# No other keys needed

# For local development server
PORT=3000
```

### Setting up Environment Variables on Vercel

1. In your Vercel dashboard, go to your project settings
2. Navigate to the "Environment Variables" tab
3. Add the following environment variables:
   - `STRIPE_SECRET_KEY`: Your Stripe secret key
   - `STRIPE_WEBHOOK_SECRET`: Your Stripe webhook signing secret

## Payment Processing

### Stripe (Serverless implementation)

The application uses Stripe for payments through Vercel serverless functions:

1. API endpoints are in the `/api` directory:
   - `/api/create-checkout.js`: Creates Stripe Checkout sessions
   - `/api/webhook.js`: Handles Stripe webhooks
   - `/api/session.js`: Retrieves session information

2. Client-side code in `stripeService.ts` communicates with these endpoints

3. To set up Stripe webhooks:
   - Register a webhook in the Stripe dashboard
   - Set the endpoint to `https://mppp.fr/api/webhook`
   - Add the webhook secret to your Vercel environment variables

## License

[MIT](LICENSE)