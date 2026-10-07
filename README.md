# Bright Path

A responsive learning-community prototype based on the supplied UI mockup. It uses vanilla JavaScript ES modules, HTML, and CSS; there is no build step or package installation.

## Run it

Because the app uses JavaScript modules, serve this folder from localhost (for example, with VS Code Live Server) and open `index.html`. Until Supabase is configured, the UI shows **Local preview** and uses browser-local data.

## Connect Supabase (free plan)

Supabase provides the hosted PostgreSQL database, email/password authentication, and REST API used by this frontend. Project-specific browser settings live in a per-developer ignored file.

1. Create a Supabase project using the [Supabase dashboard](https://supabase.com/dashboard). The free plan is suitable for an initial prototype; plan limits and terms may change.
2. In the project's **SQL Editor**, run [`supabase/schema.sql`](supabase/schema.sql). It creates the tables, profile/group/vote triggers, indexes, and row-level security policies. Re-run it after Bright Path schema updates to add new feature tables/columns and policies. It does not drop tables or user data; existing tables are not automatically migrated if their columns were changed manually.
3. From **Project Settings → API Keys**, copy the **Project URL** and **publishable key**. For local development, copy [`services/supabaseConfig.local.example.js`](services/supabaseConfig.local.example.js) to `services/supabaseConfig.local.js` and enter the values there. The actual local config is ignored by Git. A publishable key is designed for browser use; never put a `sb_secret_` or service-role key there.
4. In Vercel, open the project's **Settings → Environment Variables** and add `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` for the environments you deploy (Production, and Preview if needed). Redeploy after adding or changing them. The `/api/config` function returns only these browser-safe values; it does not read or expose secret/service-role keys. Without both valid values, the site stays in local-preview mode.
5. In Supabase **Authentication → Sign In / Providers → Email**, turn off **Confirm email** if learners should be able to sign in immediately after signup. Bright Path does not provide an in-app email verification step. This is a Supabase project setting and cannot be changed by the browser app.
6. Deploy to Vercel. Its single `/api/config` function supplies the browser-safe settings; Supabase hosts the database and Auth API separately, which this app calls directly.

The browser may contain the Supabase **publishable** key; database row-level security is the access boundary. Never put a `sb_secret_` or service-role key in this frontend. Keep RLS enabled and review policies before putting real learner data online.

## Structure

- `components/pages/` — one ES module component per page: `LandingPage`, `SignupPage`, `LoginPage`, `HomePage`, `ResourcesPage`, `StudyGroupsPage`, `QuestionsPage`, `CommunityPage`, `AILearningHubPage`, `MessagesPage`, `NotificationsPage`, and `ProfilePage`.
- `components/Navigation.js` and `components/PageHelpers.js` — shared layout and UI helpers.
- `services/` — browser-side data-service modules for auth, profiles, resources, groups, questions, discussions, messages, notifications, and browser storage.
- `app.js` — routing, page rendering, form handling, and UI event coordination.

## API behavior and remaining production work

When Supabase is configured, account creation/sign-in and resources, groups, questions/answers/votes, discussions, direct messages, group chat, reviews, notifications, saved resources, and profiles use the hosted API/database. New accounts are private by default; users can change messaging visibility and light/dark/system theme in Settings. Private-account message requests require approval once before ongoing chat. Open direct and group chats refresh new messages about every 2.5 seconds. Group images use a private Supabase Storage bucket and are limited to JPG, PNG, or WebP images up to 5 MB. Audio/video calls use WebRTC media with Supabase-polled signaling and a call history; calls ring for up to 60 seconds before being marked unanswered. The current WebRTC configuration includes a public STUN server but no TURN relay, so calls may fail on restrictive networks until a TURN service is configured. The local fallback is a same-browser demo, not production authentication; image sharing and calls require connected Supabase. The AI learning principles are built-in site copy, not user-created content.

Before a public launch, configure a TURN relay, add moderation/reporting, privacy and retention controls, backups, abuse prevention, and testing for the project's safeguarding requirements. Do not store sensitive student data until those protections are ready.

## Kenyan imagery and motion

The landing and account screens use contemporary Kenyan school photos via Wikimedia Commons: [female students at Shela Primary School, Lamu County](https://commons.wikimedia.org/wiki/File:Female_students_at_Shela_Primary_School_-_Lamu_County,_Kenya.jpg) and [a teacher training students in digital literacy](https://commons.wikimedia.org/wiki/File:Kenyan_teacher_training_students.jpg). Both are by Queen Asali and licensed under [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/); attribution appears on the site. The images load from Wikimedia and require an internet connection.

Page entrances, hover feedback, and button interactions use CSS motion. The `prefers-reduced-motion` setting is respected.
