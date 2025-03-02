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
   git clone https://github.com/your-username/mon-ptit-poulet.git
   cd mon-ptit-poulet
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

The application can be deployed to any static hosting service:

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

Create a `.env` file in the root directory with the following variables:

```
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_key
VITE_HUBSPOT_API_KEY=your_hubspot_key
```

## License

[MIT](LICENSE)