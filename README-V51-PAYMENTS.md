# WOWSHOPPING V51 — Real Payment Architecture

This build adds the checkout methods:
- Visa / Mastercard via PayHere
- KOKO — Buy Now, Pay Later (UI + merchant configuration placeholder; live KOKO charging requires the KOKO-approved merchant integration/API details)
- Bank Transfer
- Cash on Delivery

## Admin → Payments

The admin panel now has a **Payments** section. It saves public payment configuration to Firestore:
- PayHere Merchant ID
- KOKO merchant reference / ID and KOKO-provided checkout URL
- Bank name, account name, account number, branch and instructions
- COD enable/disable, fee and instructions

## PayHere security

Do **not** put the PayHere Merchant Secret into `index.html` or any public JavaScript. PayHere requires a server-generated hash and server-side notification verification.

Set the secret in Firebase Functions:

```cmd
firebase functions:secrets:set PAYHERE_MERCHANT_SECRET
```

The Cloud Functions included here are:
- `createPayHereCheckout`
- `payhereNotify`

The checkout function reads the Merchant ID from Firestore and the Merchant Secret from the server secret, creates the PayHere hash, and returns a secure checkout form. The notification function verifies PayHere's signature before marking an order paid.

## Deploy

From `v50/WOWSHOPPING-V50`:

```cmd
firebase login
firebase use wowshopping-cd8bd
cd functions
npm install
cd ..
firebase functions:secrets:set RESEND_API_KEY
firebase functions:secrets:set OTP_FROM
firebase functions:secrets:set PAYHERE_MERCHANT_SECRET
firebase deploy --only functions,hosting,firestore
```

Use a real PayHere-approved domain in the PayHere account and in Admin → Payments. PayHere documents that the Merchant ID is account-specific and the Merchant Secret is generated for the approved integrating domain/app.

## KOKO

The checkout can display KOKO and the admin panel can store the merchant reference and integration URL. A real KOKO transaction must not be fabricated: after KOKO approves the merchant account, use the exact API/checkout specification and credentials KOKO provides. Those details are not available in this build and are not guessed.

## Bank Transfer / COD

These are real order methods without a payment-gateway API. Bank-transfer orders are recorded as pending until the merchant verifies the transfer. COD orders are recorded as pending until delivery/collection is confirmed.
