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

## Admin Routing Structure

Admin uses a **Stack → Tabs → Stack** pattern:
- `(admin)/redeem.tsx` — redirect to `(tabs)`
- `(admin)/redeem/(tabs).tsx` — Stack layout wrapping tabs
- `(admin)/redeem/(tabs)/_layout.tsx` — Tabs layout (All / Pending / Profile)
- `(admin)/redeem/(tabs)/index.tsx` — All tab (with in-page sub-filters: all/pending/approved/rejected)
- `(admin)/redeem/(tabs)/pending.tsx` — Pending tab (inline approve/reject buttons)
- `(admin)/redeem/(tabs)/profile.tsx` — Profile tab
- `(admin)/redeem/[id].tsx` — detail modal (transparentModal, tab bar stays visible)
- `(admin)/redeem/approve/[id].tsx` — approve modal
- `(admin)/redeem/reject/[id].tsx` — reject modal

Modal screens use `router.back()` to return to previous tab. After approve/reject, use `router.dismissTo('/(admin)/redeem/(tabs)/pending')` to navigate back to the PENDING tab.

## Typography System

Use the standardized `TYPOGRAPHY` constant across all pages:

```tsx
const TYPOGRAPHY = {
  h1: { fontFamily: 'SpaceGrotesk-Bold', fontWeight: '700' as const },
  h2: { fontFamily: 'nimbus-mono.regular', fontWeight: '400' as const },
  h3: { fontFamily: 'LiberationSans-Regular', fontWeight: '400' as const },
};
```

Apply via: `fontFamily: TYPOGRAPHY.h1.fontFamily` in style objects.

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

## Common Gotchas

- Route conflicts: Expo Router matches `page.tsx` before `(group)/page.tsx`. Use redirects (`Redirect` from `expo-router`) when parent-level page conflicts with nested routes.
- Tab bar visibility: Modal screens (`presentation: 'transparentModal'`) inherit the parent Tabs tab bar. Use Stack wrapping to keep tab bar visible.
- LSP path errors: Use `as any` cast for router.push paths with interpolated variables.
- Modal navigation back: Use `router.back()` for close/tutup buttons in modals. Use `router.dismissTo('/path')` when completing an action needs to navigate to a specific tab.