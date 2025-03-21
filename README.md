# Loyalty Bean

![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)
![React](https://img.shields.io/badge/React-19-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Vite](https://img.shields.io/badge/Vite-6-purple)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-blue)

A professional web application for coffee shops to manage customer loyalty programs, track purchases, and handle free coffee redemptions.

## Overview

Loyalty Bean transforms traditional punch card systems into a digital loyalty management platform. The application helps businesses build meaningful connections with customers through an elegant, easy-to-use interface.

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

## Prerequisites

- Node.js (v18+)
- npm or yarn
- Supabase account with project set up

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
- `npm run clean`: Clean build artifacts
- `npm run build:clean`: Clean and rebuild
- `npm run analyze`: Analyze bundle size

## Production Deployment

To build the application for production:

```bash
npm run build:prod
```

This will create optimized production files in the `dist` directory that you can deploy to any static hosting service.

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

### Development Build

For local development with full source maps and without minification:

```bash
npm run dev
```

## Environment Variables

The application is configured to handle environment variables using Vite's `import.meta.env` to access variables from the `.env` file.

This is managed in the `src/lib/config.ts` file, which provides a consistent interface for accessing these variables throughout the application.

## Troubleshooting

### Environment Variables Not Loading

If your application cannot access environment variables, try the following steps:

1. **Check .env File**:
   Ensure your `.env` file is in the project root and contains all required variables.

2. **Clear Build Cache**:
   Sometimes Vite's build cache can cause issues with environment variable replacement:
   ```bash
   npm run clean
   rm -rf node_modules/.vite
   npm install
   ```

## Upcoming Features

- **WhatsApp Integration**: Send loyalty updates, redemption notifications, and special offers directly through WhatsApp
- **Enhanced Analytics**: More detailed insights into customer loyalty patterns
- **Multiple Reward Tiers**: Support for various reward levels and special promotions

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.