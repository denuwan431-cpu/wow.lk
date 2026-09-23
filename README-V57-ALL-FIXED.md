WOWSHOPPING V57 - ALL FIXED

This package is based on V56 and keeps the existing Firebase, PayHere, Bank Transfer and COD architecture.

Fixes included:
- Admin Panel Customers view uses the protected /listUsers backend endpoint.
- Customer records include Firebase Auth fields plus saved Firestore profile/address fields when present.
- Customer table is text-only; emoji characters were removed from index.html and admin.html.
- Admin endpoint verifies the Firebase ID token and the admin custom claim before returning users.
- PayHere merchant secret remains server-side.

IMPORTANT:
After replacing your local project files, deploy the Firebase Functions/Hosting so the updated listUsers function is actually live:
  firebase deploy --only functions,hosting,firestore

The Customers page cannot show data that has never been saved by the customer.
