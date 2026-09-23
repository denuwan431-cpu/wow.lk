# WOWSHOPPING - REAL VERCEL AUTH SETUP

This build uses Firebase Authentication + Firestore as the single source of truth for customer authentication/profile data.

## Important
Do NOT test authentication by double-clicking index.html. That creates a file:// URL. Google OAuth and Firebase phone verification need a web origin.

Test with:
- Vercel production/preview URL, or
- an HTTP local server such as http://localhost:5500

## Firebase Authentication
Enable:
- Authentication > Sign-in method > Google
- Authentication > Sign-in method > Phone

Authentication > Settings > Authorized domains:
- your-project.vercel.app
- your custom domain (if used)
- localhost only for local development, if needed

## Phone SMS
Phone Auth uses Firebase RecaptchaVerifier and signInWithPhoneNumber(). The number is normalized to E.164 (+947xxxxxxxx). Real SMS delivery still depends on Firebase's project configuration, SMS region policy/quota and abuse protections.

## Session
The app explicitly uses LOCAL persistence. Firebase remains the authentication source of truth after refresh/reopen. Sign-out calls Firebase signOut(), which clears the auth session.

## Firestore
Customer profile documents are stored at users/{uid}. The Firebase Auth uid is the document key. Phone/email are read from Firebase Auth; profile name/photo/role are synchronized to Firestore.

## Do not put
Never put a Firebase Admin SDK private key, service-account JSON, database password, or secret key in index.html.
