# MINDLE App Overview

## Purpose

MINDLE is a mobile app for university students to study smarter together. Based on the current codebase, the app is designed to help students:

- find study groups
- connect with tutors
- track study progress
- build a campus-based learning community

It is currently tailored toward Nigerian universities and uses WhatsApp as a practical contact channel for connecting users.

## Core Product Idea

The app appears to serve two related user types:

- `Student`: joins study groups and finds tutors
- `Tutor`: offers tutoring services and can also join groups

Every user creates an account, completes a profile, and is then taken into the main app experience.

## Main User Flow

The current intended flow is:

1. User opens the app
2. User sees onboarding/welcome slides
3. User chooses an authentication method
4. User signs up or logs in
5. User completes profile setup
6. User enters the main app
7. User uses bottom tabs to navigate between main sections

In code, the flow is:

`Welcome -> AuthOptions -> Signup/Login -> ProfileSetup -> MainApp`

If a returning user logs in and already has `profileCompleted: true`, they go straight to the main app.

## App Structure

The app currently contains these major sections:

- Onboarding
- Authentication
- Profile setup
- Main app with bottom tab navigation

The main tabs are:

- Home
- Groups
- Tutors
- Profile

## Screen-by-Screen Overview

### 1. Welcome Screen

**Purpose**

Introduce the app and explain the value proposition before account creation.

**Current content**

- 3 onboarding slides
- branded illustrations/images
- short marketing copy about studying smarter together
- `Skip` action
- `Next` action
- final `Get Started` button

**What it communicates**

- MINDLE is for campus community and collaborative studying
- users can find study groups and tutors
- studying should feel less lonely and more effective

### 2. Auth Options Screen

**Purpose**

Let the user choose how to begin authentication.

**Current content**

- app logo
- `Continue with Google` button
- `Sign up with Email` button
- `Already have an account? Log in` link

**Behavior**

- Email signup is wired
- Login is wired
- Google sign-in is only a placeholder right now

### 3. Signup Screen

**Purpose**

Create a new account with email and password.

**Current content**

- Full name input
- Email input
- Password input
- Confirm password input
- password requirement checklist:
  - minimum 8 characters
  - one uppercase letter
  - one number
  - one special character
- `Sign up` button
- link to login

**What happens on submit**

- Firebase Authentication account is created
- a Firestore `users/{uid}` document is created with basic information
- `profileCompleted` is set to `false`
- user is moved into profile setup

### 4. Login Screen

**Purpose**

Allow returning users to sign in.

**Current content**

- Email input
- Password input
- `Forgot password?` text
- `Log in` button
- link to signup

**Behavior**

- Signs in with Firebase Auth
- checks the user document in Firestore
- sends user either to:
  - `MainApp` if profile is complete
  - `ProfileSetup` if profile is incomplete

**Note**

Forgot password is visible in the UI but not yet implemented.

### 5. Profile Setup Screen

**Purpose**

Collect the academic and contact information needed to personalize the experience.

**Current content for all users**

- account type selector:
  - `Find Study Groups & Tutors`
  - `Offer Tutoring Services`
- university picker
- department input
- year of study picker
- WhatsApp number input

**Tutor-only content**

- Bio
- Hourly rate
- Availability

**Current university model**

The app currently includes a hardcoded list of Nigerian universities, such as:

- University of Lagos
- University of Ibadan
- Obafemi Awolowo University
- University of Nigeria, Nsukka
- Covenant University

**What happens on submit**

- profile data is saved to Firestore
- `profileCompleted` becomes `true`
- user is sent to the main app

## Main App Navigation

After onboarding and profile setup, the user enters a bottom-tab app.

### 6. Home Screen

**Purpose**

Serve as the user dashboard and primary summary screen.

**Current content**

- dynamic greeting based on time of day
- first name display
- profile shortcut button
- stats cards such as:
  - `Day Streak`
  - `Avg Score`
- `Your Progress` section
- `Today's Sessions` section
- `Study Groups` call-to-action
- `Quick Stats` section

**Data source today**

Most of the Home screen content is currently mock data inside the component, including:

- tutor progress items
- upcoming sessions
- quick stats values

**Intended future behavior**

This screen is clearly meant to become a personalized dashboard with live data pulled from the backend, such as:

- active tutoring sessions
- progress in courses
- number of joined groups
- upcoming study or tutoring appointments
- learning streaks and performance metrics

### 7. Groups Screen

**Purpose**

Help users discover and join study groups.

**Current content**

- title and short intro text
- placeholder card saying groups are coming soon

**Likely intended future content**

- list of available study groups
- group title and course code
- university or department relevance
- member count
- schedule or activity frequency
- join/request-to-join action
- maybe search and filters by course, school, year, or department

### 8. Tutors Screen

**Purpose**

Help users find tutors.

**Current content**

- title and short intro text
- placeholder card saying tutor directory is coming soon

**Likely intended future content**

- tutor list or directory
- tutor name
- courses/subjects taught
- university and department
- bio
- availability
- hourly rate or free indicator
- rating and review count
- contact or booking action

The profile setup already stores tutor-specific fields, so the Tutors screen is very likely meant to query and display users with `accountType: "tutor"`.

### 9. Profile Screen

**Purpose**

Allow users to view and manage their account.

**Current content**

- title and intro text
- current user email
- logout button

**Current behavior**

- logout signs the user out through Firebase Auth
- user is returned to the welcome flow

**Likely intended future content**

- full profile details
- edit profile
- academic info
- tutor info if applicable
- settings/preferences
- linked contact details
- maybe support/help and account management actions

## Shared App Behavior

### User Context

The app has a `UserContext` that:

- listens for Firebase auth state changes
- fetches user profile data from Firestore
- exposes `userData`
- exposes `loading`
- exposes `refreshUserData`

This means the intended architecture is for screens to personalize the UI using the current logged-in user's Firestore document.

### Fonts and Branding

The app loads a custom font, `Fredoka-SemiBold`, and uses branded image assets for:

- onboarding
- logos
- splash/icon assets

The visual style is built around:

- dark navy primary color
- bright red accent color
- white/light gray backgrounds

## Data Model Inferred From Current Code

The Firestore user document currently appears to include fields like:

- `uid`
- `email`
- `name`
- `university`
- `department`
- `yearOfStudy`
- `whatsappNumber`
- `accountType`
- `profileCompleted`
- `createdAt`

For tutors, it may also include:

- `bio`
- `hourlyRate`
- `availability`
- `rating`
- `reviewsCount`

## What Is Already Implemented

The following parts are meaningfully built:

- onboarding flow
- email signup
- email login
- Firebase Auth integration
- Firestore user profile creation
- profile completion flow
- main tab navigation
- a styled Home screen
- logout

## What Is Present But Not Fully Built

These features are clearly planned but not complete yet:

- Google sign-in
- forgot password flow
- real study groups listing and join flow
- real tutors directory and discovery flow
- booking/contact flow for tutors
- real dashboard data on Home
- richer profile management

## How the App Will Likely Function End-to-End

Based on the current implementation, the intended end-to-end experience is probably:

1. A student downloads the app and learns what it does from onboarding.
2. The student creates an account or logs in.
3. The student selects their university, department, year, and role.
4. If they are a tutor, they add teaching details.
5. The student reaches a dashboard that summarizes study activity.
6. They browse study groups relevant to their campus or courses.
7. They browse tutors who match their needs.
8. They connect with people, likely through WhatsApp or later in-app workflows.
9. They return regularly to track sessions, progress, and community activity.

## Likely Content Inventory

If we describe the full app in terms of pages and content, it currently contains or implies:

- Welcome / onboarding
  - intro messaging
  - illustrations
  - CTA to start
- Auth choice
  - Google option
  - email signup option
  - login link
- Signup
  - name, email, password, confirmation
- Login
  - email, password
- Profile setup
  - university
  - department
  - year of study
  - WhatsApp number
  - account type
  - tutor-specific details
- Home
  - greeting
  - overview metrics
  - progress tracking
  - sessions
  - study groups CTA
- Groups
  - future directory/list of study groups
- Tutors
  - future directory/list of tutors
- Profile
  - account details
  - logout

## Important Notes

### 1. Nigeria-first positioning

The current data and wording strongly suggest the app is being built first for Nigerian campus communities.

### 2. MVP stage

This project looks like an early MVP:

- core account flow is real
- main marketplace/community features are still being scaffolded
- some dashboard content is present mostly as UI and placeholder data

### 3. Security and cleanup follow-up

There is an obfuscated code blob appended to `tailwind.config.js` that does not fit the rest of the codebase. It should be reviewed and likely removed before continued development.

## Recommended Next Documentation Files

If expanded later, this overview can be split into:

- `PRODUCT_REQUIREMENTS.md`
- `USER_FLOWS.md`
- `SCREEN_CONTENT_SPEC.md`
- `FIRESTORE_SCHEMA.md`
- `ROADMAP.md`

## Summary

MINDLE is a student-focused campus study app built around onboarding, identity, academic context, tutor discovery, and group-based learning. The authentication and profile foundation are already in place, while the major social and academic discovery features are the next pieces to build out.
