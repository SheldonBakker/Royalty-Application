# Coffee Shop Loyalty Application

A web application for coffee shops to manage customer loyalty programs, track coffee purchases, and handle free coffee redemptions.

## Features

- **Customer Management**: Add, edit, and delete customer records
- **Purchase Tracking**: Record coffee purchases per customer
- **Reward System**: Automatic redemption of free coffee after threshold is met
- **Dashboard**: View key metrics and recent activity
- **Redemption History**: Track when free coffees have been redeemed
- **Authentication**: Secure login for staff members only
- **Payment System**: Paystack integration for credit system
- **Account Credits**: Access premium features with credit balance

## Technology Stack

- **Frontend**: React 19 with TypeScript, Tailwind CSS
- **Backend**: Supabase (Authentication, Database)
- **Build Tool**: Vite 6
- **Payment Processing**: Paystack
- **Hosting**: Cloudflare Workers

## Prerequisites

- Node.js (v18+)
- npm or yarn
- Supabase account with project set up
- Cloudflare account (for deployment)

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/yourusername/royalty-application.git
cd royalty-application
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with your Supabase and Paystack credentials:
```
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_PAYSTACK_PUBLIC_KEY=your-paystack-public-key
```

4. Set up your Supabase database with the following tables:

- **clients**: Stores customer information
  - id (uuid, primary key)
  - name (text)
  - phone_number (text, unique)
  - coffees_purchased (integer)
  - created_at (timestamp with timezone)

- **redemptions**: Tracks reward redemptions
  - id (uuid, primary key)
  - client_id (uuid, foreign key to clients.id)
  - redemption_date (timestamp with timezone)
  - created_at (timestamp with timezone)

- **settings**: Stores application settings
  - id (uuid, primary key)
  - redemption_threshold (integer) - Default: 10
  - has_paid (boolean) - Default: false
  - credit_balance (numeric) - Default: 0
  - created_at (timestamp with timezone)

- **payment_transactions**: Tracks payment transactions
  - id (uuid, primary key)
  - user_id (uuid, foreign key to auth.users.id)
  - amount (numeric)
  - status (varchar) - Options: 'pending', 'completed', 'failed'
  - reference (varchar, unique)
  - created_at (timestamp with timezone)
  - payment_provider (varchar)
  - provider_reference (varchar)
  - metadata (jsonb)

5. Start the development server:
```bash
npm run dev
```

6. Open your browser and navigate to http://localhost:5173

## Usage

1. **Register/Login**: Create a staff account to access the system
2. **Add Credit**: Add credit to your account using Paystack to access premium features
3. **Add Customers**: Register new customers with their name and phone number
4. **Record Purchases**: Add coffees to customer accounts as they make purchases
5. **Process Redemptions**: Click the Redeem button when a customer has earned a free coffee
6. **View Dashboard**: See statistics and recent activity

## Available Scripts

- `npm run dev`: Starts the development server
- `npm run build`: Standard build for production
- `npm run build:prod`: Optimized production build
- `npm run lint`: Run ESLint to check code quality
- `npm run preview`: Preview the production build locally
- `npm run deploy`: Build and deploy to Cloudflare Workers
- `npm run deploy:staging`: Build and deploy to Cloudflare Workers staging environment
- `npm run clean`: Clean build artifacts
- `npm run build:clean`: Clean and rebuild
- `npm run analyze`: Analyze bundle size

## Production Deployment

To build and deploy the application to Cloudflare Workers:

```bash
npm run deploy
```

This will:
1. Build the application with optimizations
2. Deploy to Cloudflare Workers using Wrangler

## Deploying to Cloudflare Workers

### Prerequisites

1. Install Wrangler CLI:
   ```
   npm install -g wrangler
   ```
2. Authenticate with Cloudflare:
   ```
   wrangler login
   ```

### Setting Environment Variables

There are two ways to set environment variables in Cloudflare:

#### Method 1: Using the Cloudflare Dashboard

1. Go to the Cloudflare Dashboard
2. Navigate to Workers & Pages
3. Select your application
4. Go to Settings > Variables
5. Add your environment variables:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `PAYSTACK_PUBLIC_KEY`

#### Method 2: Using Wrangler CLI

Use the following commands to set your secrets:

```bash
wrangler secret put SUPABASE_URL
wrangler secret put SUPABASE_ANON_KEY
wrangler secret put PAYSTACK_PUBLIC_KEY
```

The CLI will prompt you to enter the values securely.

### Local Development with Secrets

For local development with Wrangler, create a `.dev.vars` file in the project root:

```
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
PAYSTACK_PUBLIC_KEY=your_paystack_public_key
```

This file is automatically loaded by Wrangler when running `wrangler dev`, making your secrets available in the local development environment.

**Important**: The `.dev.vars` file is included in `.gitignore` to prevent committing secrets to your repository.

## Build Optimization

The application uses an optimized build process to minimize bundle size and improve performance:

### Production Build

Use the optimized production build when deploying:

```bash
npm run build:prod
```

This build process:

1. **Bundle Splitting**: Automatically splits vendor dependencies into separate chunks:
   - React and related libraries (`vendor-react.js`)
   - Supabase client (`vendor-supabase.js`)
   - Other dependencies (`vendor.js`)
   - Application code (`main.js`)

2. **Aggressive Minification**:
   - Removes comments and whitespace
   - Performs multiple compression passes
   - Removes console logs and debugger statements in production

3. **Asset Optimization**:
   - Adds content hashes to file names for optimal caching
   - Optimizes CSS delivery

4. **Environment Variable Handling**:
   - Preserves runtime environment variable access for Cloudflare Workers
   - Does not embed sensitive values at build time

### Development Build

For local development with full source maps and without minification:

```bash
npm run dev
```

## How Environment Variables Work

The application is configured to handle environment variables in two ways:

1. In development, it uses Vite's `import.meta.env` to access variables from the `.env` file
2. In production (Cloudflare Workers), it accesses the environment variables directly from the global scope

This is managed in the `src/lib/config.ts` file, which provides a consistent interface for accessing these variables throughout the application.

## Troubleshooting

### Environment Variables Not Loading from Cloudflare Secrets

If your application is still using environment variables from your local `.env` file instead of Cloudflare Secrets, try the following steps:

1. **Verify Secrets Configuration**: 
   Make sure your secrets are properly set in Cloudflare:
   ```bash
   wrangler secret list
   ```
   You should see your secrets listed. If not, add them using the commands in the "Using Cloudflare Secrets" section.

2. **Check .dev.vars File**:
   For local development, ensure you have created a `.dev.vars` file with your environment variables.

3. **Clear Build Cache**:
   Sometimes Vite's build cache can cause issues with environment variable replacement:
   ```bash
   npm run clean
   rm -rf node_modules/.vite
   ```

4. **Ensure Dynamic Configuration**:
   Check that your application is using dynamic configuration loading as implemented in the `src/lib/config.ts` file:
   - Don't directly reference `import.meta.env` in other files
   - Always use the exported `getEnvConfig()` function to access environment variables

5. **Rebuild and Deploy**:
   ```bash
   npm run build
   wrangler deploy
   ```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
