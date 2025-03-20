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

- **Frontend**: React with TypeScript, Tailwind CSS
- **Backend**: Supabase (Authentication, Database)
- **Build Tool**: Vite
- **Payment Processing**: Paystack

## Prerequisites

- Node.js (v14+)
- npm or yarn
- Supabase account with project set up

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/yourusername/coffee-loyalty.git
cd coffee-loyalty
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

5. Run the SQL setup script to configure database functions and policies:
```bash
psql -U your_username -d your_database -a -f payment_system_setup.sql
```

6. Start the development server:
```bash
npm run dev
```

7. Open your browser and navigate to http://localhost:5173

## Usage

1. **Register/Login**: Create a staff account to access the system
2. **Add Credit**: Add credit to your account using Paystack to access premium features
3. **Add Customers**: Register new customers with their name and phone number
4. **Record Purchases**: Add coffees to customer accounts as they make purchases
5. **Process Redemptions**: Click the Redeem button when a customer has earned a free coffee
6. **View Dashboard**: See statistics and recent activity

## Production Deployment

To build the application for production:

```bash
npm run build
```

The build output will be in the `dist` directory, which you can deploy to your hosting provider of choice.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Development Setup

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file in the root directory with the following variables:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_PAYSTACK_PUBLIC_KEY=your_paystack_public_key
   ```
4. Start the development server:
   ```
   npm run dev
   ```

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

### Deployment

#### Deploy to Production

```bash
npm run deploy
```

#### Deploy to Staging

```bash
npm run deploy:staging
```

## How Environment Variables Work

The application is configured to handle environment variables in two ways:

1. In development, it uses Vite's `import.meta.env` to access variables from the `.env` file
2. In production (Cloudflare Workers), it accesses the environment variables directly from the global scope

This is managed in the `src/lib/config.ts` file, which provides a consistent interface for accessing these variables throughout the application.
