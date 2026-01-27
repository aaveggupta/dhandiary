# DhanDiary

A modern personal finance tracker with a beautiful glassmorphism design. Track your dhan (wealth) with ease.

## Features

- **Multi-Account Management** - Track bank accounts, credit cards, and cash
- **Transaction Tracking** - Log income and expenses with categories
- **Real-time Balance Updates** - Account balances update automatically
- **Credit Card Tracking** - Monitor credit limits, outstanding amounts, and utilization
- **Dashboard Analytics** - View net worth, monthly income/expenses, and weekly activity
- **Responsive Design** - Works seamlessly on desktop and mobile

## Tech Stack

| Layer            | Technology              |
| ---------------- | ----------------------- |
| Framework        | Next.js 15 (App Router) |
| Database         | PostgreSQL (Neon)       |
| ORM              | Prisma                  |
| Authentication   | Clerk                   |
| State Management | TanStack React Query    |
| Styling          | Tailwind CSS            |
| Validation       | Zod                     |
| Language         | TypeScript              |

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database (we use [Neon](https://neon.tech))
- [Clerk](https://clerk.com) account for authentication

### Environment Variables

Create a `.env` file with:

```env
# Database
DATABASE_URL="postgresql://..."

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
CLERK_WEBHOOK_SECRET=whsec_...

# Clerk URLs
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding
```

### Installation

```bash
# Install dependencies
npm install

# Generate Prisma client
npm run db:generate

# Push schema to database
npx prisma db push

# Seed default categories
npm run db:seed

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Scripts

| Command               | Description                  |
| --------------------- | ---------------------------- |
| `npm run dev`         | Start development server     |
| `npm run build`       | Build for production         |
| `npm run start`       | Start production server      |
| `npm run lint`        | Run ESLint                   |
| `npm run lint:fix`    | Fix ESLint errors            |
| `npm run format`      | Format code with Prettier    |
| `npm run typecheck`   | Run TypeScript type checking |
| `npm run db:generate` | Generate Prisma client       |
| `npm run db:push`     | Push schema to database      |
| `npm run db:migrate`  | Run database migrations      |
| `npm run db:studio`   | Open Prisma Studio           |
| `npm run db:seed`     | Seed default categories      |

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication pages
│   ├── (dashboard)/       # Main app pages
│   ├── (onboarding)/      # Onboarding flow
│   └── api/               # API routes
├── components/
│   ├── layout/            # Sidebar, MobileNav
│   ├── shared/            # Reusable components
│   └── ui/                # Base UI components
├── hooks/                 # React Query hooks
├── lib/                   # Utilities, constants, validations
├── providers/             # React context providers
└── types/                 # TypeScript types
```

## Database Schema

- **User** - Synced from Clerk via webhooks
- **UserSettings** - Currency preference, onboarding status
- **Account** - Bank accounts, credit cards, cash
- **Transaction** - Income and expense records
- **Category** - Transaction categories (system + user-defined)

## License

Private - All rights reserved

---

Built with Next.js and deployed on Vercel
