WOWSHOPPING Google Login Fix

This build uses Firebase Google Authentication with signInWithRedirect instead of a popup.
This avoids Chrome popup-blocker issues.

Firebase project:
- Project ID: wowshopping-cd8bd
- Auth domain: wowshopping-cd8bd.firebaseapp.com

Before testing:
1. Firebase Console -> Authentication -> Sign-in method -> Google must be Enabled.
2. Authentication -> Settings -> Authorized domains must include localhost for local testing.
3. Run the site through HTTP, for example: python -m http.server 5500
4. Open http://localhost:5500/
5. Click account -> Continue with Google.

If Firebase returns an error, the site now displays the Firebase auth error code instead of the generic message.
