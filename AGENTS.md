# AGENTS.md - Nexa Mobile App

## Quick Start

```bash
cd apps/mobile
npx expo start        # dev server
npx expo start --android
npx expo start --ios
npx expo start --web
```

## Build Commands

```bash
npx expo lint                    # lint (from apps/mobile)
npm run deploy                   # convex dev + deploy (from apps/mobile)
```

## Architecture

- **App**: `apps/mobile/app/` - Expo Router file-based routing
- **Backend**: `apps/mobile/convex/` - Convex serverless functions
- **Schema**: `apps/mobile/convex/schema.ts`

## Routing Convention

| Prefix | Purpose |
|--------|---------|
| `(auth)` | Auth screens (login, register) |
| `(tabs)` | Main app tabs (home, courses, wallet, profile) |
| `(admin)` | Admin-only routes |
| Direct | Course/lesson/payment detail routes |

## Environment Variables

Copy `.env.example` to `.env.local` before running:
- `CONVEX_DEPLOYMENT`
- `EXPO_PUBLIC_CONVEX_URL`
- `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `MIDTRANS_CLIENT_KEY` / `MIDTRANS_SERVER_KEY`

## Stack

- Expo SDK 54, React Native 0.81.5
- Expo Router (file-based routing)
- Convex (backend + auth)
- Clerk (authentication)
- TailwindCSS v4 + NativeWind
- React Navigation (bottom tabs)



## Rules

Before attempting to fix any problem or write code:

1. Analyze the code structure first  
2. Understand the overall application architecture  
3. Identify available skills and tools  

4. Use `skill_find("*")` to list all available skills  
5. Select the most appropriate skill for the problem  
6. Use `skill_use("<selected_skill>")` to apply the chosen skill  

7. If needed, combine multiple skills to solve the problem effectively  
8. Apply the selected skill(s) step-by-step  

9. Do not proceed with implementation before completing the analysis above