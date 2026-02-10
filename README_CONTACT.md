# Contact Form (Vercel + Turnstile + Resend)

## What is implemented
- Frontend sends `POST /api/contact`
- Backend verifies Turnstile token (if `TURNSTILE_SECRET_KEY` is set)
- Backend sends email via Resend

## Required Vercel Environment Variables
- `RESEND_API_KEY`
- `CONTACT_TO_EMAIL` (receiver, e.g. `kontakt@2heartpillows.de`)
- `CONTACT_FROM_EMAIL` (verified sender in Resend, e.g. `2heartpillows <noreply@yourdomain.com>`)
- `TURNSTILE_SECRET_KEY` (optional but recommended)

## Frontend site key
Set your Turnstile site key in:
- `index.html`, `data-turnstile-sitekey="..."`

If empty, Turnstile is not rendered on frontend.

## Local notes
- Without Vercel env vars, `/api/contact` returns config error.
- You can still deploy safely; just add env vars in Vercel Project Settings.

