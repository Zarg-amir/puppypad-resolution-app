# PuppyPad Resolution Center

One-touch customer support application built with React, TypeScript, and Cloudflare Pages + Functions.

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Zustand
- **Backend**: Cloudflare Pages Functions (Hono)
- **Database**: Cloudflare D1
- **Storage**: Cloudflare R2
- **Deployment**: Cloudflare Pages

## Project Structure

```
puppypad-resolution-app/
├── src/                    # React frontend
│   ├── components/        # React components
│   │   ├── chat/         # Chat app components
│   │   ├── forms/        # Form components
│   │   ├── hub/          # Admin hub components
│   │   └── shared/       # Shared components
│   ├── pages/            # Page components
│   ├── services/         # API clients
│   ├── stores/           # Zustand stores
│   ├── styles/           # Global CSS
│   └── utils/            # Utilities
├── functions/             # Cloudflare Pages Functions (API)
│   └── api/              # API routes
├── shared/                # Shared types & constants
│   ├── types/            # TypeScript types
│   └── constants/        # Business logic constants
├── migrations/            # D1 database migrations
└── public/               # Static assets
```

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run with Wrangler (for testing Functions)
npm run dev:functions

# Build for production
npm run build

# Deploy to Cloudflare Pages
npm run deploy
```

## Environment Variables

Set these in your Cloudflare Pages dashboard or `.dev.vars` file:

- `JWT_SECRET` - Secret for JWT token signing
- `SHOPIFY_STORE_URL` - Shopify store URL
- `SHOPIFY_ACCESS_TOKEN` - Shopify Admin API token
- `CLICKUP_API_KEY` - ClickUp API key
- `CLICKUP_LIST_ID` - ClickUp list ID for cases
- `PARCELPANEL_API_KEY` - ParcelPanel API key (optional)
- `RICHPANEL_API_KEY` - Richpanel API key (optional)

## Features

### Customer App (/)
- Chat-based customer support interface
- Order lookup by email/phone
- Product selection for issues
- Resolution ladder (refund/shipping/subscription offers)
- Case creation and tracking

### Admin Hub (/hub)
- Dashboard with case statistics
- Cases list with filtering and search
- Case detail view with comments
- Analytics dashboard
- Team management

## Deployment

This app deploys to Cloudflare Pages with Functions:

1. Connect your GitHub repo to Cloudflare Pages
2. Set build command: `npm run build`
3. Set build output directory: `dist`
4. Add environment variables in Pages settings
5. Deploy!

The frontend is built by Vite, and the `functions/` directory is automatically deployed as Pages Functions.

## Database

D1 database migrations are in `migrations/`. Run migrations with:

```bash
wrangler d1 migrations apply puppypad-resolution-analytics
```

## License

Private - All rights reserved.
