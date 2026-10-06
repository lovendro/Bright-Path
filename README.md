# Bright Path

A responsive learning-community prototype based on the supplied UI mockup. It uses vanilla JavaScript ES modules, HTML, and CSS; there is no build step or package installation.

## Run it

Because the app uses JavaScript modules, serve this folder from localhost (for example, with VS Code Live Server) and open `index.html`. Until Supabase is configured, the UI shows **Local preview** and uses browser-local data.

## Connect Supabase (free plan)

Supabase provides the hosted PostgreSQL database, email/password authentication, and REST API used by this frontend. Project-specific browser settings live in a per-developer ignored file.

1. Create a Supabase project using the [Supabase dashboard](https://supabase.com/dashboard). The free plan is suitable for an initial prototype; plan limits and terms may change.
2. In the project's **SQL Editor**, run [`supabase/schema.sql`](supabase/schema.sql). It creates the tables, profile/group/vote triggers, indexes, and row-level security policies. It does not drop tables or user data; re-running it replaces only the named policies and triggers. Existing tables are not automatically migrated if their columns were changed manually.
3. From **Project Settings → API Keys**, copy the **Project URL** and **publishable key**. For local development, copy [`services/supabaseConfig.local.example.js`](services/supabaseConfig.local.example.js) to `services/supabaseConfig.local.js` and enter the values there. The actual local config is ignored by Git. A publishable key is designed for browser use; never put a `sb_secret_` or service-role key there.
4. In Vercel, open the project's **Settings → Environment Variables** and add `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` for the environments you deploy (Production, and Preview if needed). Redeploy after adding or changing them. The `/api/config` function returns only these browser-safe values; it does not read or expose secret/service-role keys. Without both valid values, the site stays in local-preview mode.
5. In Supabase **Authentication → URL Configuration**, add your local development URL and deployed Vercel URL to the allowed redirect URLs.
6. To use the app's 6-digit confirmation form, set the **Confirm signup** email template to include the `{{ .Token }}` value, and keep **Confirm email** enabled in Auth settings. Users enter the emailed code on Bright Path before signing in. If you use a link-only template instead, the code form will not have a code to submit.
7. Deploy to Vercel. Its single `/api/config` function supplies the browser-safe settings; Supabase hosts the database and Auth API separately, which this app calls directly.

The browser may contain the Supabase **publishable** key; database row-level security is the access boundary. Never put a `sb_secret_` or service-role key in this frontend. Keep RLS enabled and review policies before putting real learner data online.

## Structure

- `components/pages/` — one ES module component per page: `LandingPage`, `SignupPage`, `LoginPage`, `HomePage`, `ResourcesPage`, `StudyGroupsPage`, `QuestionsPage`, `CommunityPage`, `AILearningHubPage`, `MessagesPage`, `NotificationsPage`, and `ProfilePage`.
- `components/Navigation.js` and `components/PageHelpers.js` — shared layout and UI helpers.
- `services/` — browser-side data-service modules for auth, profiles, resources, groups, questions, discussions, messages, notifications, and browser storage.
- `app.js` — routing, page rendering, form handling, and UI event coordination.

## API behavior and remaining production work

When Supabase is configured, account creation/sign-in and resources, groups, questions/votes, discussions, messages, notifications, saved resources, and profiles use the hosted API/database. Otherwise, the same API modules retain a localStorage demo fallback. The local fallback is not production authentication. Resource sharing stores metadata only; it does not upload files. Messaging is currently a simple private message history, not a full recipient-based chat system. The AI learning principles are built-in site copy, not user-created content.

Before a public launch, add storage for file uploads, peer-to-peer messaging, moderation/reporting, privacy and retention controls, backups, abuse prevention, and testing for the project's safeguarding requirements. Do not store sensitive student data until those protections are ready.

## Kenyan imagery and motion

The landing and account screens use contemporary Kenyan school photos via Wikimedia Commons: [female students at Shela Primary School, Lamu County](https://commons.wikimedia.org/wiki/File:Female_students_at_Shela_Primary_School_-_Lamu_County,_Kenya.jpg) and [a teacher training students in digital literacy](https://commons.wikimedia.org/wiki/File:Kenyan_teacher_training_students.jpg). Both are by Queen Asali and licensed under [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/); attribution appears on the site. The images load from Wikimedia and require an internet connection.

Page entrances, hover feedback, and button interactions use CSS motion. The `prefers-reduced-motion` setting is respected.
