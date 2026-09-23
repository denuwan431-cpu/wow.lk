# WOWSHOPPING V50 — REAL AUTH + REAL EMAIL OTP

This is an HTML/CSS/JS storefront with real Firebase Authentication and a real server-side email OTP flow.

## Included
- Google Sign-In through Firebase Authentication.
- Email login by a real 6-digit OTP sent from a Firebase Cloud Function.
- OTP expires after 10 minutes and is hashed server-side; max 5 verification attempts.
- Email OTP can create the Firebase customer account automatically.
- Real Firestore `users/{uid}` records.
- Admin panel is blocked until Firebase Authentication succeeds AND the signed-in user has the `admin: true` custom claim.
- Firestore rules included for customer-owned user/order records.
- No fake OTP, no fake users, no browser-side OTP secret.

## One-time setup (required for 100% live authentication)
1. Create a Firebase project and Web App.
2. Enable Authentication > Google.
3. Enable Authentication > Email/Password (needed for the separate admin account).
4. Create Firestore.
5. Put your Firebase Web App config in BOTH `index.html` and `admin.html` where `YOUR_FIREBASE_*` appears.
6. Install Firebase CLI and run `firebase login`, then `firebase use YOUR_PROJECT_ID`.
7. In the project folder run `cd functions && npm install && cd ..`.
8. Create a Resend account and a verified sending domain/email.
9. Set Firebase secrets:
   - `firebase functions:secrets:set RESEND_API_KEY`
   - `firebase functions:secrets:set OTP_FROM` (example: `WOWSHOPPING <no-reply@yourdomain.com>`)
   - `firebase functions:secrets:set ALLOWED_ORIGIN` (local test can be `http://127.0.0.1:5500`; production should be your exact HTTPS site origin)
10. Deploy: `firebase deploy`.
11. In Firebase Authentication, create the admin email/password account.
12. Download a Firebase service-account JSON as `serviceAccount.json` in the project root, then run `node scripts/set-admin.js admin@example.com`. Delete the service-account file after use.
13. Add your production domain to Firebase Authentication > Settings > Authorized domains.

## Local testing
Because this is HTML, do NOT open `index.html` with `file://`. Serve the folder with a local HTTP server, e.g. VS Code Live Server (`http://127.0.0.1:5500`). For full real OTP testing, deploy the Functions and set `ALLOWED_ORIGIN` to that local origin, or use the Firebase Emulator Suite with a local email-sending test setup.

## Important
The ZIP is code-complete but it cannot contain your private Firebase service-account key, Firebase project config, Resend API key, or admin credentials. Those must be supplied by the site owner. This is intentional security practice.


See README-V50-FULL-SETUP.md for the configured full build and OTP deployment steps.
