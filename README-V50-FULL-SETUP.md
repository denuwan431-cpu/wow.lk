# WOWSHOPPING V50 — FULL FIREBASE AUTH + ADMIN BUILD

Firebase project is preconfigured for project `wowshopping-cd8bd`.

## Included
- Real Google Sign-In
- Real email 6-digit OTP flow (Cloud Function + Resend)
- Firebase customer accounts
- Admin panel protected by Firebase email/password + `admin:true` custom claim
- Admin Customers page showing Firebase Authentication users
- Firestore rules allowing customers to read/write their own profile and admins to read profiles
- Firebase Hosting rewrites for `/sendOtp`, `/verifyOtp`, and `/listUsers`

## Important
The Firebase Web App config is already inserted into `index.html` and `admin.html`. The Web API key is a browser/client identifier; never place a service-account private key in either HTML file.

## One-time setup for real Email OTP
The OTP functions need a real email provider. This build uses Resend. In Firebase/Google Cloud, configure these secrets for the project:
- `RESEND_API_KEY`
- `OTP_FROM` (for example `WOWSHOPPING <no-reply@your-verified-domain.com>`)
- `ALLOWED_ORIGIN` (your deployed site origin, for example `https://YOUR_PROJECT.web.app`)

From the `v50/WOWSHOPPING-V50` folder:

```bash
cd functions
npm install
cd ..
firebase login
firebase use wowshopping-cd8bd
firebase functions:secrets:set RESEND_API_KEY
firebase functions:secrets:set OTP_FROM
firebase functions:secrets:set ALLOWED_ORIGIN
firebase deploy --only functions,firestore,hosting
```

When prompted for the secret values, enter them directly; do not put them into HTML or commit them to Git.

## Admin account
The project already contains the admin Firebase user and the `admin:true` custom claim was set. If you change the admin account, sign out/in again after changing the claim so the ID token refreshes.

## Local browser testing
Do not double-click `index.html`. Run:

```bash
python -m http.server 5500
```

Then open `http://localhost:5500/`. Google authentication can be tested after adding `localhost` as an authorized domain in Firebase Authentication. The custom OTP endpoints are intended to run through Firebase Hosting after deployment.

## Security
- Never upload `serviceAccount.json` to the website.
- Never put a Firebase service-account private key into `index.html` or `admin.html`.
- Admin authorization is checked with the Firebase ID token custom claim.
- The `listUsers` endpoint rejects requests without a valid admin claim.
