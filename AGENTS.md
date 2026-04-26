# Nexa Mobile App

## Run

```bash
cd apps/mobile
npx expo start        # dev
npx expo start --android
npx expo start --ios
npx expo start --web
npx expo lint         # lint
npx tsc --noEmit      # typecheck
```

## EAS Build

```bash
cd apps/mobile
eas build -p android --profile development   # dev APK
eas build -p android --profile preview       # internal
eas build -p android --profile production    # production
eas submit -p android --latest              # submit to Play Store
```

## Convex Backend

```bash
cd apps/mobile
npm run dev        # npx convex dev  (local dev)
npm run deploy     # npx convex dev && npx convex deploy
```

## Structure

- **Root**: `package.json` workspaces → `apps/mobile`. Run all commands from `apps/mobile`.
- **App**: `apps/mobile/app/` — Expo Router file-based routing
- **Backend**: `apps/mobile/convex/` — Convex functions
- **Schema**: `apps/mobile/convex/schema.ts`
- **Components**: `apps/mobile/components/`
- **Fonts**: `assets/Fonts/` — bundled locally (not CDN)
- **Env**: `.env.example` at root → copy to `apps/mobile/.env.local`

## Routing

| Prefix | Purpose | Files |
|--------|---------|-------|
| `(auth)` | Login, register | `login.tsx`, `register.tsx` |
| `(tabs)` | Home, courses, wallet, profile | Tab bar screens |
| `(admin)` | Admin-only | `redeem/*`, `approve/*`, `reject/*` |
| Direct | Detail routes | `[id].tsx`, `(courseId).tsx`, `lesson/[id].tsx` |
| `admin/` | Legacy redirect | `_layout.tsx` → `/(admin)/redeem` |

## Admin Routes

Stack → Tabs → Stack pattern.

- `(admin)/redeem.tsx` → redirect to `(admin)/redeem/admin-tabs`
- `(admin)/redeem/redeem-tabs.tsx` — Stack wrapping tabs
- `(admin)/redeem/admin-tabs/_layout.tsx` — Tabs (All/Pending/Profile)
- Modal: `router.back()` for close, `router.dismissTo('/path')` after action

## Auth & Convex

`app_providers.tsx` is the auth wiring. Clerk + Convex are initialized here with hardcoded values (not env vars). Convex URL is `https://limitless-ermine-877.convex.cloud`.

User role is provided via `UserRoleContext` (`'admin' | 'user'`). Use `useUserRole()` hook.

## Typography

```tsx
const TYPOGRAPHY = {
  h1: { fontFamily: 'SpaceGrotesk-Bold', fontWeight: '700' as const },
  h2: { fontFamily: 'nimbus-mono.regular', fontWeight: '400' as const },
  h3: { fontFamily: 'LiberationSans-Regular', fontWeight: '400' as const },
};
```

Use: `fontFamily: TYPOGRAPHY.h1.fontFamily`

## Payment

Payment methods in `app/payment/[courseId].tsx` use Midtrans Snap API with `enabled_payments`:
- `TRANSFER BANK` → `bank_transfer`
- `GOPAY` → `gopay`
- `OVO` → `ovo`
- `QRIS` → `qris`

Backend mutation `createPaymentOrder` in `convex/payments.ts` accepts optional `paymentMethod` parameter.

Payment logos stored in `assets/images/`:
- `bank.png`, `gopay-logo.svg`, `ovo-logo.png`, `qris-logo.svg`

## Avatar Upload (Convex Storage)

Upload flow uses mutation-based approach (not HTTP route):
1. Call `api.users.generateAvatarUploadUrl()` mutation → get upload URL
2. POST file directly to that URL
3. Receive `storageId` in response JSON
4. Call `updateProfile({ avatarUrl: storageId })`

To display storage URLs, use helper:
```tsx
const getStorageUrl = (storageId?: string) => {
  if (!storageId) return undefined;
  if (storageId.startsWith('http')) return storageId;
  return `${process.env.EXPO_PUBLIC_CONVEX_SITE_URL}/api/storage/${storageId}`;
};
```

Required package: `expo-image-picker` (installed)

## Duration Data

Lesson durations stored in **seconds** in database. Display as **minutes**:
```tsx
// Correct: convert seconds to minutes
{Math.ceil((lesson.duration || 0) / 60)} MIN
// Wrong: just display the number directly
{lesson.duration} MIN  // Shows seconds as minutes
```

## Course Badges

- **FREE**: Background `#FFFBEB`, Text `#78350F` (warm cream/brown)
- **PREMIUM**: Background `#FEF3C7`, Text `#B45309` (light amber/dark amber)
- **Badge in featured cards**: Always yellow primary (`#FFC800`)
- **Coin badge**: Yellow background (`#FFC800`), dark text, pill shape (radius 16)

Premium badge price format: `Rp ${price?.toLocaleString('id-ID')}` (not coin symbol)

## Stack

- Expo SDK 54, React Native 0.81.5
- Expo Router, Convex, Clerk, TailwindCSS v4 + NativeWind (tailwind config uses `nativewind/preset`)
- EAS Build (configured in `apps/mobile/eas.json`)

## Mistral AI Agent (Redeem Investigation)

AI agent automatically investigates every redeem request after payment is confirmed.

### Setup di dashboard.mistral.ai

1. Create agent: `RedeemRiskInvestigator`
2. Model: `mistral-small-latest`
3. System prompt (copy dari `convex/aiInvestigation.ts` `SYSTEM_PROMPT`)
4. No tools needed (data passed via prompt)

### Environment Variables

```
MISTRAL_API_KEY=p-your-api-key
MISTRAL_AGENT_ID=your-agent-id
```

### Flow

1. User submit redeem → payment → `confirmRedeemPayment` action
2. Payment confirmed → auto-trigger `investigateRedeemRequest` action
3. Action collects user data (behavior, coin history, enrollment, previous redeems)
4. POST to Mistral API → parse response → save to `redeemRequests` table
5. Admin panel shows AI analysis card with risk level, recommendation, reasoning

### AI Fields in `redeemRequests`

- `aiRiskLevel`: `LOW | MEDIUM | HIGH`
- `aiReasoning`: string (Bahasa Indonesia)
- `aiRecommendation`: `APPROVE | REJECT | HOLD`
- `aiAnalyzedAt`: timestamp

## Path Aliases

Both `babel-plugin-module-resolver` and `tsconfig` paths:
- `@/*` → `apps/mobile/*`
- `@convex/*` → `apps/mobile/convex/*`

## Gotchas

- **Route conflicts**: Expo Router matches `page.tsx` before `(group)/page.tsx`. Use `Redirect` for parent conflicts.
- **Tab bar in modals**: Modal with `presentation: 'transparentModal'` inherits Tabs tab bar. Wrap with Stack to keep visible.
- **LSP path errors**: Cast `router.push` paths with interpolated vars as `any`.
- **Featured card images**: Use `absoluteFillObject` + overlay (`rgba(0,0,0,0.75)`) for proper text contrast.
- **Badge z-index**: Use `zIndex: 20` on avatar edit button and `zIndex: 10` on container.
- **Hardcoded credentials**: `app_providers.tsx` has hardcoded Clerk publishable key and Convex URL — not env-driven.
- **Fonts**: Bundled in `assets/Fonts/`, loaded via `require()` in `_layout.tsx`. Do not replace with CDN URLs.