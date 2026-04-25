# MINDLE Development Tasks

## How To Use This Document

This is a detailed build checklist for taking MINDLE from its current MVP state to a more complete, production-ready app. It is organized in phases so work can be done in a practical order.

You can use this document in three ways:

- as a roadmap
- as a sprint planning checklist
- as a definition of what still needs to be built

## Current State Summary

What is already in place:

- onboarding screens
- email signup and login
- Firebase Authentication
- Firestore user profile creation
- profile setup flow
- bottom-tab navigation
- basic Home screen UI
- placeholder Groups, Tutors, and Profile screens

What is not complete yet:

- secure project cleanup
- robust auth flows
- real groups system
- real tutors system
- booking/contact workflows
- editable profile
- live dashboard data
- search/filter experiences
- backend structure beyond basic user documents
- testing and release prep

## Phase 0: Immediate Cleanup And Safety

These tasks should happen first before feature expansion.

### 0.1 Remove suspicious code from `tailwind.config.js`

- inspect the appended obfuscated code
- confirm it is not intentionally required by the project
- remove the obfuscated block
- keep only the valid Tailwind config
- verify the app still starts successfully after cleanup

**Done when**

- `tailwind.config.js` contains only expected Tailwind configuration
- the app builds without config errors

### 0.2 Audit Firebase configuration handling

- review whether Firebase config should stay committed
- move sensitive or environment-specific values into a safer config pattern if needed
- decide how dev, staging, and production environments will be separated

**Done when**

- environment strategy is defined
- config usage is documented

### 0.3 Clean up dependency usage

- confirm whether both `firebase` and `@react-native-firebase/*` are intentionally needed
- remove unused packages
- confirm Expo compatibility with the chosen Firebase setup
- document the final preferred stack

**Done when**

- dependencies match actual usage
- no confusing duplicate Firebase approach remains

### 0.4 Add project documentation basics

- create or update a `README.md`
- include project purpose, setup steps, run commands, and current status
- include Firebase setup notes
- link to `APP_OVERVIEW.md` and this task document

**Done when**

- a new contributor can clone and run the app without guessing

## Phase 1: Stabilize Core App Architecture

Before adding more screens, the app should have a cleaner structure.

### 1.1 Improve app boot/auth state handling

- add a proper auth gate at app startup
- show a loading/splash state while auth status is being resolved
- route users automatically based on:
  - logged out
  - logged in but profile incomplete
  - logged in with completed profile
- reduce reliance on manual `navigation.replace(...)` flow control

**Done when**

- app launch consistently lands users in the correct place
- refreshes and reopen flows behave correctly

### 1.2 Reorganize folders for scale

- introduce clearer directories if needed, such as:
  - `screens/`
  - `components/`
  - `services/`
  - `hooks/`
  - `constants/`
  - `utils/`
- move reusable UI into components
- move Firebase queries into service/helper files

**Done when**

- screen files no longer carry all business logic directly
- shared logic is reusable and readable

### 1.3 Define Firestore collections and app data model

- document required collections
- decide naming conventions
- define relationships between:
  - users
  - groups
  - memberships
  - tutor profiles
  - tutoring sessions
  - reviews
  - notifications
- identify required indexes for search/filter queries

**Done when**

- a written schema exists
- new features are built against a planned structure instead of ad hoc documents

### 1.4 Add shared validation utilities

- centralize validation for:
  - email
  - password strength
  - phone numbers
  - required profile fields
  - tutor form fields
- remove duplicated inline validation where possible

**Done when**

- validation is consistent across signup, profile setup, and future edit forms

### 1.5 Create reusable UI primitives

- buttons
- text inputs
- form field wrappers
- loading states
- empty states
- section headers
- cards

**Done when**

- design is more consistent
- repeated JSX is reduced

## Phase 2: Complete Authentication And Account Flows

The app already has the basics, but the auth experience still needs finishing.

### 2.1 Implement forgot password flow

- add reset password action from Login
- connect to Firebase password reset
- show success and failure messages clearly

**Done when**

- users can reset forgotten passwords without support help

### 2.2 Implement Google sign-in

- decide Expo-compatible Google auth approach
- configure Firebase provider
- wire UI button on Auth Options screen
- handle first-time Google users
- send new Google users into profile setup if needed

**Done when**

- Google sign-in works for both new and returning users

### 2.3 Improve auth error handling

- normalize Firebase errors into user-friendly messages
- handle network failures gracefully
- add loading states everywhere auth can block input

**Done when**

- auth failures feel clear and recoverable

### 2.4 Prevent incomplete or overwritten user data

- review `setDoc` behavior during signup and profile setup
- decide whether to use merge behavior
- preserve fields correctly when users complete or update profiles

**Done when**

- profile data cannot be accidentally wiped by later writes

## Phase 3: Finish Profile System

User identity and academic context are core to the app.

### 3.1 Upgrade Profile screen from placeholder to full account page

- display:
  - full name
  - email
  - university
  - department
  - year of study
  - WhatsApp number
  - account type
- if tutor, also display:
  - bio
  - hourly rate
  - availability
  - rating
  - review count

**Done when**

- Profile screen reflects actual stored user data

### 3.2 Add edit profile functionality

- allow users to update academic and contact details
- allow tutors to update tutor-specific details
- prefill forms with existing profile data
- validate before saving
- refresh user context after update

**Done when**

- users can manage their profile without deleting and recreating accounts

### 3.3 Improve account type logic

- confirm whether users should be allowed to switch between `student` and `tutor`
- define consequences of switching
- handle migration safely if account type changes

**Done when**

- role behavior is predictable and supported by the data model

### 3.4 Expand university data strategy

- decide whether to keep hardcoded universities or move them to:
  - constants file
  - Firestore collection
  - API source
- consider support for more campuses later

**Done when**

- campus data is easy to maintain and expand

## Phase 4: Build The Study Groups Feature

This is one of the app's primary product features.

### 4.1 Design the group data model

Each group likely needs:

- group name
- course code
- course title
- university
- department or faculty
- year relevance
- description
- meeting format
- schedule
- group creator
- member count
- created date
- status

**Done when**

- Firestore shape for groups is documented and ready

### 4.2 Build groups listing screen

- replace placeholder content
- fetch groups from Firestore
- show group cards with key info
- support loading, empty, and error states

**Done when**

- user can browse real groups

### 4.3 Add group details screen

- show complete group information
- show organizer/admin info
- show course and campus context
- show member count
- show meeting schedule
- show contact/join controls

**Done when**

- users can inspect a group before joining

### 4.4 Add join/request-to-join flow

- define whether groups are open join or approval-based
- store user membership records
- prevent duplicate joins
- update group member count

**Done when**

- user can successfully join a group and that membership persists

### 4.5 Add create group flow

- build a form for creating a study group
- validate required inputs
- set creator as group admin
- save group to Firestore

**Done when**

- users can create new groups from the app

### 4.6 Add group search and filters

- search by course code or title
- filter by university
- filter by department/faculty
- filter by year of study
- optionally sort by newest, largest, or most relevant

**Done when**

- groups are discoverable at scale

### 4.7 Add “My Groups” view

- show groups the user has joined
- let users leave a group
- show pending requests if approval-based groups exist

**Done when**

- users can manage their own group participation

## Phase 5: Build The Tutors Feature

This is the other major product pillar.

### 5.1 Design the tutor directory model

Tutor data likely comes from user profiles but may need extra structure for:

- subjects/courses taught
- availability slots
- rates
- rating
- reviews
- active/inactive status

**Done when**

- tutor discovery supports realistic filtering and profile display

### 5.2 Build tutors listing screen

- replace placeholder content
- fetch tutors from Firestore
- show cards with:
  - name
  - department/university
  - short bio
  - hourly rate
  - rating
  - availability summary

**Done when**

- users can browse real tutor profiles

### 5.3 Add tutor details screen

- show full tutor profile
- subjects/courses taught
- longer bio
- rate
- availability
- reviews
- contact or booking CTA

**Done when**

- users can evaluate tutors properly before contacting them

### 5.4 Add tutor search and filters

- search by tutor name
- search by course/subject
- filter by university
- filter by department
- filter by price/free
- filter by rating

**Done when**

- users can narrow down tutors efficiently

### 5.5 Add tutor contact/booking flow

- decide product behavior:
  - direct WhatsApp contact
  - in-app request
  - session booking form
- store tutoring request/session records
- show request success state

**Done when**

- a student can take action from a tutor profile and that action is tracked

### 5.6 Add tutor self-management tools

- tutor can edit availability
- tutor can edit pricing
- tutor can toggle active/inactive availability
- tutor can see incoming requests

**Done when**

- tutors can maintain their listings without developer help

## Phase 6: Turn Home Into A Real Dashboard

The current Home screen is styled well, but the data is mock data.

### 6.1 Define dashboard metrics

Decide what Home should actually show for each user type.

For students:

- number of joined groups
- upcoming sessions
- saved tutors or active tutor engagements
- study streak
- recent activity

For tutors:

- upcoming tutoring sessions
- number of students helped
- active requests
- review rating
- earnings summary if paid tutoring is tracked

**Done when**

- dashboard sections are purposeful and based on real data

### 6.2 Replace mock progress data with real backend data

- remove static arrays from Home screen
- fetch relevant session/progress/group data
- compute display metrics

**Done when**

- Home is personalized per user

### 6.3 Add quick actions

- create group
- browse tutors
- view my groups
- edit profile
- see upcoming sessions

**Done when**

- Home becomes a useful command center instead of a static summary

### 6.4 Add empty states by role

- no groups joined
- no sessions booked
- no tutor requests yet
- no progress data yet

**Done when**

- first-time users understand what to do next

## Phase 7: Messaging, Contact, And Communication

The app strongly implies connection between users, especially via WhatsApp.

### 7.1 Define communication model

- decide whether communication stays external via WhatsApp or moves in-app later
- define what happens when a user taps contact
- decide whether phone numbers should always be visible or only after join/request

**Done when**

- contact flow is consistent and privacy-aware

### 7.2 Integrate WhatsApp deep linking

- create a standard open-chat action
- format numbers safely
- handle missing or invalid numbers

**Done when**

- users can contact each other smoothly from the app

### 7.3 Add request/approval notifications

- notify users when:
  - someone joins a group
  - a tutoring request is sent
  - a request is accepted or rejected

**Done when**

- users don’t miss important actions in the system

## Phase 8: Reviews, Ratings, And Trust Features

To make tutoring trustworthy, users need confidence signals.

### 8.1 Create reviews model

- reviewer user id
- tutor user id
- rating value
- review text
- timestamp

**Done when**

- review storage supports listing and score calculations

### 8.2 Add tutor rating system

- allow students to rate tutors after a session or engagement
- prevent duplicate abuse if needed
- update aggregate rating and review count

**Done when**

- tutor cards can show meaningful trust signals

### 8.3 Add moderation rules for reviews

- define edit/delete/report behavior
- prevent obviously broken or abusive submissions

**Done when**

- review system is manageable as real users arrive

## Phase 9: UX And Design Refinement

Once the product features are in, the experience should be polished.

### 9.1 Make design system consistent

- normalize spacing
- normalize type scale
- normalize button styles
- normalize form fields
- normalize card patterns

**Done when**

- all screens feel like one product

### 9.2 Improve navigation ergonomics

- confirm whether some screens should be nested stacks inside tabs
- add proper back behavior where needed
- reduce awkward screen replacements

**Done when**

- moving around the app feels natural

### 9.3 Add skeleton/loading states

- for dashboard
- for groups
- for tutors
- for profile

**Done when**

- loading feels intentional instead of abrupt

### 9.4 Improve empty and error states

- write helpful copy
- add retry actions
- direct users toward next meaningful action

**Done when**

- dead ends are reduced across the app

### 9.5 Add accessibility basics

- check text contrast
- improve button labels
- ensure touch targets are large enough
- add accessibility labels where needed

**Done when**

- app is more usable across different user needs

## Phase 10: Backend Rules And Data Protection

As soon as multiple users interact, backend protection matters.

### 10.1 Write Firestore security rules

- users should only edit their own profile
- only authorized users should create/update certain records
- group membership rules should be enforced
- tutor reviews should be constrained

**Done when**

- reads and writes are protected by clear rules

### 10.2 Define data ownership rules

- who can edit a group
- who can delete a group
- who can accept or reject join requests
- who can create tutoring records

**Done when**

- permission logic is documented and enforced

### 10.3 Prepare indexes and query support

- add Firestore indexes for expected filters
- test performance on groups and tutors queries

**Done when**

- app queries do not fail due to missing index requirements

## Phase 11: Testing And Quality Assurance

Before release, the app needs repeatable checks.

### 11.1 Add manual QA checklist

- signup
- login
- logout
- forgot password
- profile completion
- profile editing
- group creation and joining
- tutor discovery and contact
- dashboard correctness

**Done when**

- every major flow has a repeatable QA path

### 11.2 Add unit or integration tests where practical

- validation utilities
- auth helpers
- service-layer functions
- critical data formatting utilities

**Done when**

- high-risk logic is covered by tests

### 11.3 Test across devices and screen sizes

- small Android phones
- larger Android phones
- iPhone dimensions
- poor network conditions if possible

**Done when**

- layouts and flows behave consistently

### 11.4 Test first-time user and returning user journeys

- first signup
- interrupted profile setup
- returning login with complete profile
- returning login with incomplete profile

**Done when**

- user state transitions are reliable

## Phase 12: Launch Preparation

This phase prepares the app for real users.

### 12.1 Finalize branding and assets

- app icon
- splash screen
- store screenshots
- onboarding visuals
- consistent naming and copy

**Done when**

- product presentation is polished

### 12.2 Prepare app store metadata

- app description
- feature bullets
- category
- privacy details
- support contact

**Done when**

- store submission assets and copy are ready

### 12.3 Set up production environment

- production Firebase project
- production config
- release build process
- deployment checklist

**Done when**

- you can build and distribute a real production version safely

### 12.4 Add analytics and monitoring

- define key events:
  - signup completed
  - profile completed
  - group joined
  - tutor contacted
  - session booked
- add crash/error monitoring if possible

**Done when**

- you can measure app usage and catch failures after launch

## Suggested Build Order Inside Features

If you want a practical execution order, this is the recommended sequence:

1. Remove suspicious code and clean up config
2. Stabilize app architecture and auth flow
3. Finish Profile screen and profile editing
4. Build real Groups feature
5. Build real Tutors feature
6. Turn Home into a live dashboard
7. Add communication/contact workflows
8. Add reviews/ratings
9. Add backend rules and testing
10. Prepare for release

## Suggested MVP Completion Definition

You can reasonably call MINDLE "feature-complete MVP" when all of the following are true:

- users can sign up, log in, reset password, and log out
- users can complete and edit profiles
- students can browse, search, join, and create study groups
- students can browse and contact tutors
- tutors can manage their tutor profile and availability
- Home shows real personalized data
- Firestore rules protect data correctly
- major flows are tested
- the app can be released to real test users

## Nice-To-Have After MVP

These can wait until after the core app works well:

- in-app chat
- push notifications
- session scheduling calendar
- payments for tutors
- saved/favorited tutors
- group discussion boards
- admin moderation panel
- university-specific communities
- referral system
- gamification and badges

## Final Note

The app already has a strong foundation in onboarding, branding, and account flow. The biggest work remaining is turning the attractive shell into a real academic network with live data, useful discovery, and reliable user actions. This checklist is meant to make that path clearer and easier to execute step by step.
