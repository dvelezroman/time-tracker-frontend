# Time Tracker Frontend

Modern, scalable Next.js frontend application with Material UI, TypeScript, and state management for the Time Tracker system.

## Features

- **Next.js 16** with App Router
- **Material UI v7** with theming support (light/dark mode)
- **TypeScript** for type safety
- **Zustand** for state management
- **Axios** for API communication
- **React Hook Form** with Zod validation
- **Responsive design** with mobile-first approach
- **Authentication** with protected routes
- **Error handling** with error boundaries
- **Toast notifications** for user feedback

## Prerequisites

- Node.js 18 or higher
- npm, yarn, pnpm, or bun
- Time Tracker API running (see time-tracker-api)

## Installation

1. Install dependencies:

```bash
npm install
```

2. Set up environment variables:

```bash
cp .env.example .env
```

Edit `.env` file with your configuration:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## Running the Application

```bash
# Development server
npm run dev

# Production build
npm run build
npm run start

# Lint code
npm run lint

# Format code
npm run format

# Check code formatting
npm run format:check
```

Open [http://localhost:3001](http://localhost:3001) (or the port shown in terminal) to see the application.

## Project Structure

```
time-tracker-frontend/
├── app/                    # Next.js App Router pages
│   ├── dashboard/          # Dashboard page
│   ├── login/              # Login page
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Home page
├── components/             # React components
│   ├── common/             # Reusable common components
│   │   ├── Button.tsx      # Custom button with loading
│   │   ├── ErrorBoundary.tsx
│   │   ├── Loading.tsx
│   │   ├── ProtectedRoute.tsx
│   │   └── Toast.tsx       # Toast notification system
│   └── layout/             # Layout components
│       ├── Header.tsx      # App header with navigation
│       ├── Sidebar.tsx     # Navigation sidebar
│       ├── Footer.tsx      # App footer
│       └── MainLayout.tsx   # Main layout wrapper
├── lib/                    # Utilities and helpers
│   ├── api/                # API client and services
│   │   ├── client.ts       # Axios client with interceptors
│   │   └── services/      # API service files
│   ├── constants/          # Constants and configuration
│   ├── theme/              # Material UI theme
│   │   ├── theme.ts        # Theme configuration
│   │   └── ThemeProvider.tsx
│   └── utils/              # Utility functions
├── store/                  # Zustand stores
│   ├── useAuthStore.ts     # Authentication store
│   └── useUIStore.ts       # UI state store (theme, loading)
├── hooks/                  # Custom React hooks
│   └── useAuth.ts          # Authentication hook
├── types/                  # TypeScript type definitions
└── public/                 # Static assets
```

## Key Features

### Authentication

- Login/Logout functionality
- Protected routes with role-based access
- Token management with automatic refresh
- Persistent authentication state

### State Management

- **Auth Store**: User authentication state
- **UI Store**: Theme mode, loading states

### API Integration

- Centralized API client with interceptors
- Automatic token injection
- Error handling and retry logic
- Service-based architecture

### Theming

- Light and dark mode support
- Custom Material UI theme
- Theme persistence
- Responsive breakpoints

### Components

- Reusable Material UI components
- Loading states and skeletons
- Error boundaries
- Toast notifications
- Protected route wrapper

## Environment Variables

| Variable                  | Description         | Default                 |
| ------------------------- | ------------------- | ----------------------- |
| `NEXT_PUBLIC_API_URL`     | Backend API URL     | `http://localhost:3000` |
| `NEXT_PUBLIC_APP_NAME`    | Application name    | `Time Tracker`          |
| `NEXT_PUBLIC_APP_VERSION` | Application version | `1.0.0`                 |

## Development

### Code Quality

- ESLint for linting
- Prettier for code formatting
- TypeScript for type checking

### Best Practices

- Component-based architecture
- Separation of concerns
- Reusable utilities
- Type-safe API calls
- Error handling
- Loading states

## API Integration

The frontend connects to the Time Tracker API. Make sure the API is running and accessible at the URL specified in `NEXT_PUBLIC_API_URL`.

API endpoints are defined in `lib/constants/index.ts` and services are in `lib/api/services/`.

## Deployment

The application can be deployed to:

- Vercel (recommended for Next.js)
- Netlify
- Any Node.js hosting platform

Make sure to set environment variables in your deployment platform.

## License

Private - UNLICENSED
