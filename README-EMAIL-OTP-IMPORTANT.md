# WOWSHOPPING Email OTP — important

The website frontend is already configured for the Firebase project `wowshopping-cd8bd` and will call the deployed `asia-south1` functions automatically.

**Email OTP cannot work from a static localhost page until the backend Cloud Functions are deployed and the email provider secrets are configured.**

From the project root (`v50/WOWSHOPPING-V50`), run:

```bash
cd functions
npm install
cd ..
```

Set the two required secrets:

```bash
firebase functions:secrets:set RESEND_API_KEY
firebase functions:secrets:set OTP_FROM
```

When prompted:
- `RESEND_API_KEY` = your Resend API key
- `OTP_FROM` = a verified Resend sender, for example `WOWSHOPPING <no-reply@your-verified-domain.com>`

Then deploy:

```bash
firebase deploy --only functions,hosting,firestore
```

After deployment, the frontend can still be tested from `http://localhost:5500` because `index.html` uses the deployed function URL by default.

If you change the deployed function URL/region, set `window.WOW_AUTH_API_BASE` before the auth code loads.

Google login does not need the OTP backend.
