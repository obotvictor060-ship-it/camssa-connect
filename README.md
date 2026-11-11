# CAMSSA CONNECT

A responsive React starter for the CAMSSA digital information hub and student marketplace.

## Included
- Responsive homepage and navigation
- News, announcements, events, opportunities and resources sections
- Marketplace with category filters and search
- Seller submission form (requires Supabase configuration for persistent listings)
- Supabase client setup
- Database schema and Row Level Security policies in `supabase/schema.sql`
- Netlify deployment configuration

## Run locally
1. Install Node.js (LTS).
2. Extract this project.
3. Open a terminal in the project folder.
4. Run `npm install`
5. Copy `.env.example` to `.env` and add your Supabase project URL and anon/public key.
6. Run `npm run dev`
7. Open the local URL shown in the terminal.

The app can also run in preview mode without Supabase credentials. In that mode it uses sample marketplace listings; submissions are not saved.

## Connect Supabase
1. Create a project at https://supabase.com.
2. Open SQL Editor in your Supabase dashboard.
3. Run the contents of `supabase/schema.sql`.
4. In Project Settings > API, copy the Project URL and anon/public key into `.env`.
5. Restart the dev server.

Never put a Supabase service-role key in frontend code. The SQL policies are a starting point and should be reviewed before production.

## Deploy to Netlify
1. Push the project to a GitHub repository.
2. In Netlify, choose Add new site > Import an existing project.
3. Select the repository. Build command: `npm run build`; publish directory: `dist`.
4. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` under Site configuration > Environment variables.
5. Deploy.

## Before public launch
- Replace sample content with verified CAMSSA information.
- Add an official CAMSSA contact email and WhatsApp number.
- Appoint trusted administrators and assign their profile role to `admin` in Supabase.
- Publish marketplace rules, privacy notice, seller/buyer safety guidance and a takedown contact.
- Test account registration, listing approval, mobile layout and database policies.
- Obtain association/faculty approval before presenting this as an official platform.
