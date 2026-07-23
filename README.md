# MINDLE

A study marketplace for Nigerian university students. Students discover WhatsApp
study groups and book tutors; tutors offer sessions and manage requests. WhatsApp
is the communication channel — MINDLE is the discovery and booking layer on top.

## Tech stack

- **Expo** (React Native 0.83, Expo SDK 55)
- **Firebase** — Auth (email/password) + Firestore
- **React Navigation** — native-stack + bottom-tabs
- **NativeWind** (Tailwind) for styling

## Getting started

```bash
npm install
npx expo start        # JS-only changes: bundler + Expo Go / dev client
```

> **Native modules note:** the project uses libraries with native code
> (e.g. Google Sign-In). After adding, removing, or upgrading any native
> dependency — or changing `app.json` plugins — you must rebuild the native
> binary once with `npx expo run:ios` (or `run:android`). After that,
> `npx expo start` connects to it normally. Expo Go cannot run these modules.

## Firebase

- Project: `mindle-test` (dev). Config lives in `config/firebaseConfig.js`.
- Native config files (`GoogleService-Info.plist`, `google-services.json`) are
  gitignored — they carry project credentials.

### Deploying Firestore rules & indexes

Security rules and composite indexes live in `firestore.rules` and
`firestore.indexes.json`. Deploy them with:

```bash
npx firebase-tools deploy --only firestore --project mindle-test
```

**This must be run whenever the rules or indexes change** — the app relies on
them for both security and session queries.

## Data model (Firestore)

| Collection | Purpose |
|---|---|
| `users/{uid}` | Profile: name, email, university, department, accountType (`student`/`tutor`), whatsappNumber, and for tutors: bio, hourlyRate, availability, rating rollup (`rating`, `ratingSum`, `reviewsCount`), `isAvailable` |
| `sessions/{id}` | A tutoring session through its lifecycle (see below). Stores both parties' names + WhatsApp numbers so contact can be exchanged on acceptance |
| `groups/{id}` | A WhatsApp study-group listing (directory only — join opens the invite link) |
| `phones/{normalizedNumber}` | Uniqueness registry: doc ID is the number, value is `{ uid }`, so a WhatsApp number can only be claimed by one account |

### Session lifecycle

```
pending → accepted → tutor_confirmed → completed
       ↘ declined
       ↘ cancelled   (either party, from pending or accepted)
```

- Student requests → `pending`
- Tutor accepts/declines → `accepted` / `declined`
- Tutor marks done (optional student score) → `tutor_confirmed`
- Student confirms (optional tutor rating, rolled up to the tutor's profile) → `completed`

Both sides must confirm, which is what makes ratings/scores trustworthy.

## Project structure

```
screens/    UI screens (one per route)
services/   Firestore access (sessionService, groupService, userService)
context/    UserContext — auth state + profile, drives navigation
config/     firebaseConfig
utils/      whatsapp (number normalization + deep link), authErrors
```

## Current status

Feature-complete MVP:

- ✅ Sign up, log in, forgot password, log out
- ✅ Profile setup + editing (with unique WhatsApp number enforcement)
- ✅ Browse / search / create / edit study groups (WhatsApp directory)
- ✅ Browse / search tutors; request → accept → WhatsApp handoff → confirm → rate
- ✅ Tutor tools: accept/decline/cancel requests, mark done, availability toggle
- ✅ Real personalized Home dashboards (streaks, scores, ratings) for both roles
- ✅ Firestore security rules + indexes (deployed)

Not yet done: Google sign-in (temporarily disabled — needs a native rebuild),
push notifications, group-session joining, production release build.

See `APP_OVERVIEW.md` and `DEVELOPMENT_TASKS.md` for the full picture and roadmap.
